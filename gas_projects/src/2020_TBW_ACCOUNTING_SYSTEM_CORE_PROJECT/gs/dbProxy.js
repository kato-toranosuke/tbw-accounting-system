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
      case 1:
        let output_obj = { success: 0, error_message: "this is initial error message." };
        const token_id = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN_ID');
        output_obj.property_token_id = token_id;

        const account_token_id = postdata.parameters.profile_id.toString();
        // const account_token_id = postdata.parameters.profile_id;
        output_obj.user_token_id = account_token_id;
        if (token_id == account_token_id) {
          output_obj.success = 1;
        } else {
          output_obj.success = 0;
        }
        output = ContentService.createTextOutput();
        // output.setMimeType(ContentService.MimeType.JSON);
        output.setMimeType(ContentService.MimeType.TEXT);
        output.setContent(JSON.stringify(output_obj));
        break;
      default:
        console.log("invalid mode number: %d", mode);
        throw (new Error(`invalid mode number @ doPost`));
    }

  } catch (error) {
    console.error(error);
    output = ContentService.createTextOutput(`エラーが発生しました。申し訳ありませんが、もう一度お試しください。\n${error.name}: ${error.message}`);
    output.setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
    return output;
  }
}

function doGet(getdata) {
  setProperties();
  let output_obj = { success: 0, error_message: "this is initial error message." };
  try {
    console.log("doGet START\n");
    readProperties();
    const mode = parseInt(getdata.parameter.mode, 10);

    console.log("doGet mode readed\n");
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
        const result_obj = getProperties();
        output_obj.data = result_obj.data;
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
    // output.setMimeType(ContentService.MimeType.JSON);
    output.setMimeType(ContentService.MimeType.TEXT);
    output.setContent(JSON.stringify(output_obj));

    console.log("doGet ENDED\n");

    return output;
  }
}