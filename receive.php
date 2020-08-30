<?php
  try {
    $dbhost = "157.112.147.201";
    $dbname = "tbwkaikei_201909";
    $user = "tbwkaikei_kato";
    $pass = "shinjuku2015";
    $dbh = new PDO(sprintf('mysql:host=%s; dbname=%s; charset=utf8', $dbhost, $dbname), $user, $pass);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 変数
    $date = $_POST['date'];
    $ym = (int)$_POST['ym'];
    $writing = $_POST['writing'];
    $person = $_POST['person'];
    $class = $_POST['class'];
    $group = $_POST['group'];
    $g_num = (int)$_POST['g_num'];

    // r-noを取得
    $getRNO_sql = "SELECT COUNT(*) AS num from receipt where ym = " . $ym;
    $stmt_rno = $dbh->query($getRNO_sql);
    $res_rno = $stmt_rno->fetchAll(PDO::FETCH_ASSOC);
    $r_no = $ym.'-'.((int)$res_rno[0]["num"] + 1);

    // receiptテーブルにデータを登録
    $receipt_sql = "INSERT INTO receipt (ym, r_date, r_no) VALUES (?, ?, ?)";
    $stmt_rt = $dbh->prepare($receipt_sql);
    $stmt_rt->bindValue(1, $ym, PDO::PARAM_INT);
    $stmt_rt->bindValue(2, $date, PDO::PARAM_STR);
    $stmt_rt->bindValue(3, $r_no, PDO::PARAM_STR);
    $stmt_rt->execute();

    // goodsテーブルにデータを登録
    for ($i=1; $i <= $g_num ; $i++) {
      $goods_sql = "INSERT INTO goods (r_date, r_no, person, writing, class, division, g_name, g_price, g_q, g_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      $stmt_gt = $dbh->prepare($goods_sql);
      $stmt_gt->bindValue(1, $date, PDO::PARAM_STR);
      $stmt_gt->bindValue(2, $r_no, PDO::PARAM_STR);
      $stmt_gt->bindValue(3, $person, PDO::PARAM_STR);
      $stmt_gt->bindValue(4, $writing, PDO::PARAM_STR);
      $stmt_gt->bindValue(5, $class, PDO::PARAM_STR);
      $stmt_gt->bindValue(6, $group, PDO::PARAM_STR);

      $g_name = $_POST['g'.$i.'_name'];
      $g_price = $_POST['g'.$i.'_price'];
      $g_q = $_POST['g'.$i.'_q'];
      $g_note = $_POST['g'.$i.'_note'];

      $stmt_gt->bindValue(7, $g_name, PDO::PARAM_STR);
      $stmt_gt->bindValue(8, (int)$g_price, PDO::PARAM_INT);
      $stmt_gt->bindValue(9, (int)$g_q, PDO::PARAM_INT);
      $stmt_gt->bindValue(10, $g_note, PDO::PARAM_STR);
      $stmt_gt->execute();
    }

    // DB接続終了
    $dbh = null;

  } catch (PDOException $e) {
    //echo "エラー発生：".htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8')."<br>";
    header('Content-Type: text/plain; charset=UTF-8', true, 500);
    die('エラーが発生しました。申し訳ありませんが、もう一度領収証の登録をお願いします。');
  }
 ?>
<!DOCTYPE html>
<html lang="ja" dir="ltr">
 <head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1">
   <title>TBW会計システム</title>
 </head>
 <body>
   <h1>登録完了</h1>
   <p>
     領収証番号は <font size="5"><b><?php echo $r_no; ?></b></font> です。<br>
     領収証の左上にこの番号を記載して、主会計に提出して下さい。
   </p>
   <u><h3>最後に確認して下さい！</h3></u>
   <p>
     <ol>
      <li>宛名欄に<b>「筑波大学つくば鳥人間の会」</b>と記載しましたか？</li>
      <li>
        <b>但し書き</b>を記載しましたか？<br>
        <font size="2">（但し書き欄がない場合は、宛名欄の下などの適当な場所に「但し、〇〇代」と記載して下さい。）</font>
      </li>
      <li>
        担当者または会社の<b>印鑑</b>がありますか？<br>
        <font size="2">（印鑑が貰えなかった場合はOKです。）</font>
      </li>
      <li>
        領収証の裏面に<b>立替者</b>の氏名を記載しましたか？<br>
        <font size="2">（事前に会計から受け取ったお金で支払った場合は、<b>「会」</b>と記載して下さい。）</font>
      </li>
    </ol>
   </p>
   <p><a href="http://tbwkaikei.php.xdomain.jp/index.html">別の領収証を登録する</a></p>
 </body>
</html>
