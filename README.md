# Profile Canvas

16:9画像に「名前・肩書・プロフィール」を合成し、元解像度のPNG/JPEGとして書き出す静的Webアプリです。

## ランダム肩書の候補変更

`app.js`の先頭付近にある `TITLE_PREFIXES`（前半）と `TITLE_ROLES`（後半）。

```js
const TITLE_PREFIXES = Object.freeze(['さすらいの', 'はじめての', '伝説の']);
const TITLE_ROLES = Object.freeze(['冒険者', '探索者', '受付嬢']);
```

## 文字位置の変更方法

`app.js`の先頭付近にある `TEXT_LAYOUT` を編集。

```js
const TEXT_LAYOUT = Object.freeze({
  name:    { x: 0.075, y: 0.155, baseSize: 0.074, weight: 700 },
  title:   { x: 0.075, y: 0.275, baseSize: 0.034, weight: 500 },
  profile: { x: 0.075, y: 0.390, baseSize: 0.028, weight: 400, lineHeight: 1.70 }
});
```

- `x`: 左端からの開始位置。`0.075`は画像幅の7.5%
- `y`: 上端からの開始位置。`0.155`は画像高さの15.5%
- `baseSize`: 基準文字サイズ。画像高さに対する比率
- `lineHeight`: プロフィールの明示的な改行間隔


## 注意

Google Fontsの取得にはインターネット接続が必要。
