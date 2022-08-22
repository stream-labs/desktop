# N Air

[![Build status](https://ci.appveyor.com/api/projects/status/0vvxc20s1re3094d?svg=true)](https://ci.appveyor.com/project/n-air-app/n-air-app)

N AirはStreamlabs OBSをベースにした、生放送に便利な機能が豊富に組み込まれた高画質配信ソフトです。NLE（Niconico Live Encoder）よりも、さらに便利になって生まれ変わりました。
![N Air](https://n-air-app.nicovideo.jp/image/screenshot.png)

## 動作条件
* DirectX 10.1 互換のGPU
* Windows 8.1 以降(64ビット版)
* メモリ：8GB以上
* CPU：Core i5第四世代相当
* インターネット接続環境が必要です。

## インストール
<https://n-air-app.nicovideo.jp/>

## ビルド方法
### Node.js
npmパッケージをインストールし、さまざまなスクリプトを実行するにはNodeが必要です。

現在のLTSリリース8.x.xを推奨します：<https://nodejs.org/>
### Yarn
各ノードモジュールの正しいバージョンを使用するためには、yarn パッケージマネージャーを使用する必要があります。

インストール方法については、こちらを参照してください：<https://yarnpkg.com/ja/docs/install>

### Visual C++コンパイラ
yarnは、ソースから多くのネイティブ拡張をインストールしてコンパイルします。このためには、Visual C ++コンパイラが必要です：[Visual Studio Community 2017](https://visualstudio.microsoft.com/ja/downloads/)

※カスタムインストールにて、ワークロード内の「C++によるデスクトップ開発」を選択してインストールしてください。 
### CMake
N Airのネイティブアドオンの中には、コンパイルにCMakeが必要なものがあります。こちらからダウンロードできます：<https://cmake.org/download/>

※パスにCMakeを追加してください。 CMakeを利用可能な状態にするにはマシンを再起動する必要があります。 
### Python 2.7
Node-gypでは、ネイティブアドオンをインストールするためにパスにPython 2.7が必要です。

こちらからダウンロードできます：<https://www.python.org/>

### インストール
1.yarnを介してすべての node モジュールをインストールする。

```
yarn install
```

2.webpackを使用してアセットをコンパイルする。

```
yarn compile
```
### 実行
Visual Studio Codeを使用している場合は、組み込みのデバッガを使用してアプリケーションを実行できます（デフォルトのF5ボタン）。
それ以外の場合は以下のコマンドにより実行可能です。
```
yarn start
```

## ライセンス
N Air本体はGPLv3で公開しています。

N Airには外部の多くのオープンソースを利用しております。それらに関しては各パッケージのライセンス条項を御確認ください。

## Special Thanks
This Open Source Program is forked from Streamlabs OBS, a software originally created by Streamlabs.

## 開発への参加について
N Airはオープンソースであり、どなたでも開発に参加できます。プルリクエストはn-air-developmentブランチに出すようお願いいたします。

## バグ報告
- フィードバックへのリンク
  - <https://secure.nicovideo.jp/form/entry/n_air_feedback>
- issue
  - <https://github.com/n-air-app/n-air-app/issues>

## ヘルプページへのリンク
<https://qa.nicovideo.jp/faq/show/11857>
