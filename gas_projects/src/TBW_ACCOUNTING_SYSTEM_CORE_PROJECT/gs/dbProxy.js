'use strict';

function doPost(postdata) {
  let output;
  // ドキュメントロックを取得する
  const lock = LockService.getScriptLock();
  try {
    // ロックを実施する
    lock.waitLock(10000);

    readProperties();
    const mode = Number(postdata.parameters.mode.toString());
    switch (mode) {
      case 0:
        output = returnResultHtml(postdata);
        break;
      default:
        console.error("invalid mode number: %d", mode);
        throw (new Error(`invalid mode number @ doPost`));
    }

  } catch (error) {
    console.error(error);
    output = ContentService.createTextOutput(`エラーが発生しました。申し訳ありませんが、もう一度お試しください。\n${error.name}: ${error.message}`);
  } finally {
    lock.releaseLock();
    return output;
  }
}

function doGet(getdata) {
  let output_obj = { success: 0, error_message: "this is initial error message." };
  try {
    readProperties();
    const mode = parseInt(getdata.parameter.mode, 10);

    switch (mode) {
      case 1:
        output_obj = getDbData(MEMBER_DB_NAME, HEADER_ROW_NUM, 3);
        break;
      case 2:
        output_obj = getDbData(PAYMENT_DB_NAME, HEADER_ROW_NUM - 1, -1);
        break;
      case 3:
        registerNewFeePaymentData(getdata);
        break;
      case 4:
        output_obj = getDbData(FEE_DB_NAME, HEADER_ROW_NUM, 5);
        break;
      case 5:
        registerNewMembershipFee(getdata);
        break;
      case 6:
        output_obj = getDbData(ACCOUNTING_DB_NAME);
        break;
      case 7:
        registerNewAccounting(getdata);
        break;
      case 8:
        output_obj = getProperties();
        break;
      case 9:
        registerNewProperty(getdata);
        break;
      default:
        console.error("invalid mode number: %d", mode);
        throw (new Error(`invalid mode number @ doGet`));
    }

    output_obj.success = 1;
  } catch (error) {
    output_obj.success = 0;
    output_obj.error_name = error.name;
    output_obj.error_message = error.message;
  } finally {
    let output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(output_obj));
    return output;
  }
}