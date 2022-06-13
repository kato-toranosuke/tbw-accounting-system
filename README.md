# tbw-accounting-system
つくば鳥人間の会の会計システムです。<br>
Google SpreadsheetをDBとして扱う、システムです。

## システム概要
![acc_sys](https://user-images.githubusercontent.com/53859593/173289640-9b608320-ced6-4e58-8e36-95d01f58f47f.jpeg)

## 画面
<img width="1792" alt="kaikei_0" src="https://user-images.githubusercontent.com/53859593/173290935-c5522117-b339-4aa9-9956-2b8e679c7b97.png">
<img width="1791" alt="kaikei_1" src="https://user-images.githubusercontent.com/53859593/173290946-49a90e99-2a94-42e1-a1a6-abfbe4b65cb0.png">

## 必要な技術
- JavaScript
- Google Apps Script
- HTML
- CSS

## 使用しているライブラリ・フレームワーク
- Bulma
  - CSSフレームワーク
- SpreadSheetSQL
  - GoogleAppsScriptでSpreadsheetをSQLっぽく扱えるライブラリです。
  - インストール方法
    - GoogleAppsScript上でリソース > ライブラリ > ProjectIDを入力 > 選択 > 最新バージョンを選択
    - Project ID: `MAoZrMsylZMiNUMljU4QtRHEMpGMKinCk`
  - 参考サイト
    - [Qiita:GoogleAppsScriptでSQLっぽくDBを扱えるライブラリを作りました。](https://qiita.com/roana0229/items/fea931fcabc57f193620)
    - [Github:SpreadsheetSQL](https://github.com/roana0229/spreadsheets-sql)
    
## 導入方法
1. Google Driveの中のDB用SpreadsheetとGoogle Apps ScriptのProjectを複製する。
1. Projectのスクリプト・プロパティを設定する。
    - プロジェクトのプロパティ設定画面への行き方
    ![プロジェクトのプロパティ設定画面への行き方](https://www.u.tsukuba.ac.jp/~s1811411/tas-intro/b.png)
    - プロジェクトのプロパティ設定画面
    ![プロジェクトのプロパティ設定画面](https://www.u.tsukuba.ac.jp/~s1811411/tas-intro/a.png)
    - 設定するプロパティ
    ![プロパティ情報](https://www.u.tsukuba.ac.jp/~s1811411/tas-intro/c.png)
1. デプロイする。[参考動画](https://photos.app.goo.gl/PU3wbtoknxsvomHV9)
1. ウェブサイトの```web_sites/generalFunc.js```内の```BASE_URL```をデプロイした際に発行されたURLに書き換える。<br>ウェブサイトの```web_sites/signin.js```内の```BASE_URL```をデプロイした際に発行されたURLに書き換える。

### プロパティの中身
- ACCOUNTING_DB_NAME: DBとなるSSの名前
- ACCOUNTING_BOOK_TEMPLATE_ID: 出納帳のテンプレートとなるSSのID
- ADMIN_TOKEN_ID: 認証されるGoogleアカウントのID（コピペ）→改善できます
- DB_ID: DBとなるSSのID
- *_DB_NAME: 全てコピペ
- HEADER_ROW_NUM: コピペ
- ORGANIZATION_NAME: 組織名
- *_TEMPLATE_ID: 出納帳・決算書のテンプレートSSのID。コピペ
-  ROOT_FOLDER_ID: ルートフォルダとなるDrive ID。コピペ。
