let MEMBER_DB_NAME = "", PAYMENT_DB_NAME = "", FEE_DB_NAME = "", HEADER_ROW_NUM = 0, ROOT_FOLDER_ID = "", RECEIPT_TEMPLATE_NAME = "", ADMIN_FAMILY_NAME = "", ADMIN_FIRST_NAME = "", ORGANIZATION_NAME = "", YEAR = 0, ADMIN_POSITION_NAME = "", DB_ID = "", ACCOUNTING_DB_NAME="";

// Script Propertyの読み込み
function readProperties() {
  const properties = PropertiesService.getScriptProperties();
  DB_ID = properties.getProperty('DB_ID');
  MEMBER_DB_NAME = properties.getProperty('MEMBER_DB_NAME');
  PAYMENT_DB_NAME = properties.getProperty('PAYMENT_DB_NAME');
  FEE_DB_NAME = properties.getProperty('FEE_DB_NAME');
  HEADER_ROW_NUM = parseInt(properties.getProperty('HEADER_ROW_NUM'), 10);
  ROOT_FOLDER_ID = properties.getProperty('ROOT_FOLDER_ID');
  RECEIPT_TEMPLATE_NAME = properties.getProperty('RECEIPT_TEMPLATE_NAME');
  ADMIN_POSITION_NAME = properties.getProperty('ADMIN_POSITION_NAME');
  ADMIN_FAMILY_NAME = properties.getProperty('ADMIN_FAMILY_NAME');
  ADMIN_FIRST_NAME = properties.getProperty('ADMIN_FIRST_NAME');
  ORGANIZATION_NAME = properties.getProperty('ORGANIZATION_NAME');
  YEAR = properties.getProperty('YEAR');
  ACCOUNTING_DB_NAME = properties.getProperty('ACCOUNTING_DB_NAME');
}

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