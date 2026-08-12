# Express + TypeScript

本分類記錄 Express + TypeScript 專案的型別設計、Request 型別擴充與模組匯入路徑相關問題。

## 問題列表

- [JWT payload 型別要對照 Entity 主鍵型別，不能憑空假設](./001-jwt-payload-type-vs-entity.md)
- [Express Request 型別擴充（declare module）與型別檔案組織慣例](./002-express-request-type-augmentation.md)
- [Node.js ESM 專案的路徑別名限制：@ alias vs 相對路徑](./003-path-alias-vs-relative-import.md)
- [AppError class 的設計：自訂錯誤欄位與 stack trace](./004-app-error-class-design.md)
- [Express 錯誤處理的分層：service、controller 與 error middleware](./005-express-error-handling-layers.md)
- [Express module-based route 的拆分與註冊方式](./006-module-based-route-organization.md)
