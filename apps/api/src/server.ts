import 'reflect-metadata';
import { app } from './app.js';
import { env } from './config/env.js';
import { AppDataSource } from './database/data-source.js';

/**
 * 收到關機訊號後，等待進行中請求跑完的上限。
 * 超過就強制退出，避免 keep-alive 長連線讓 process 永遠關不掉，
 * 最後被 Docker／Kubernetes 用 SIGKILL 硬殺（兩者預設也是等 10 秒）。
 */
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();

    const server = app.listen(env.PORT, () => {
      console.log(`Server 啟動在 http://localhost:${env.PORT}`);
      console.log(`Swagger UI：http://localhost:${env.PORT}/docs`);
    });

    // listen 的錯誤（最常見是 port 被佔用的 EADDRINUSE）以 event 形式發出，
    // 不會被外層 try/catch 接到，必須另外掛 handler，否則會變成難讀的 uncaught error
    server.on('error', (err) => {
      console.error('HTTP server error:', err);
      process.exit(1);
    });

    // 連按兩次 Ctrl+C，或 SIGTERM 後緊接著 SIGINT，都會重複觸發 shutdown
    let isShuttingDown = false;

    const shutdown = (signal: string): void => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`${signal} received. Shutting down...`);

      const forceExit = setTimeout(() => {
        console.error('Shutdown timed out, forcing exit');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);

      // 不讓這個 timer 本身成為 process 活著的理由：
      // 若一切順利關完，process 應該立刻結束，而不是空等 10 秒
      forceExit.unref();

      const closeDatabase = async (): Promise<void> => {
        try {
          if (appDataSource.isInitialized) await appDataSource.destroy();
        } catch (err) {
          // destroy 失敗不該卡住關機流程，記錄後照樣退出
          console.error('Error closing DB:', err);
        } finally {
          clearTimeout(forceExit);
          process.exit(0);
        }
      };

      // close 只停止接受新連線，進行中的請求會跑完才觸發 callback，
      // 所以順序是「HTTP 先關 → DB 後關」，與啟動順序相反。
      // callback 的型別是 `() => void`，這裡用 void 明示不等待 closeDatabase 的 Promise
      server.close(() => {
        void closeDatabase();
      });
    };

    // 註冊後就覆蓋掉 Node 對這兩個訊號「立刻結束 process」的預設行為，
    // 何時退出改由 shutdown 決定 —— 因此它的每條路徑都必須自己呼叫 process.exit。

    // 開發時在終端機按 Ctrl+C
    process.on('SIGINT', () => {
      shutdown('SIGINT');
    });

    // 生產環境的主要來源：docker stop、K8s 滾動更新、pm2 reload、systemctl stop
    // 註：Windows 不支援送達 SIGTERM，本機只走得到上面的 SIGINT
    process.on('SIGTERM', () => {
      shutdown('SIGTERM');
    });
  } catch (err) {
    console.error('Failed to start API:', err);
    process.exit(1);
  }
}

void bootstrap();
