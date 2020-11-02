# tbw-accounting-system
つくば鳥人間の会の会計システムです。<br>
Google SpreadsheetをDBとして扱う、システムです。

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
    - [Qiita](https://qiita.com/roana0229/items/fea931fcabc57f193620)
    - [Github](https://github.com/roana0229/spreadsheets-sql)
    
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
1. ウェブサイトの```generalFunc.js```内の```base_url```をデプロイした際に発行されたURLに書き換える。
