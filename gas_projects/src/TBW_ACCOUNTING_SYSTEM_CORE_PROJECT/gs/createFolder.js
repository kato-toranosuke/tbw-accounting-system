'use strict';

async function createSS(folder_id, ss_name) {
  try {
    let output_obj = { success: 0, ss_id: "" };

    // Spread Sheetを新規作成する
    const ss_id = await SpreadsheetApp.create(ss_name).getId();
    // Spread SheetをFileオブジェクトとして取得する。
    const file = await DriveApp.getFileById(ss_id);
    // 作成したフォルダ下にssを追加
    DriveApp.getFolderById(folder_id).addFile(file);
    // ssをマイドライブから削除
    DriveApp.getRootFolder().removeFile(file);

    // 返り値を設定
    output_obj.success = 1;
    output_obj.ss_id = ss_id;

    return output_obj;
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ createFolderAndSS`));
  }
}

// function createFolderAndSS(root_folder_id, folder_name, ss_name, parent_folders_names = []) {
//   try {
//     let output_obj = { success: 0, folder_id: "", ss_id: "" };

//     // SSを配置するフォルダを作成する
//     const folder_result = addFolder(root_folder_id, folder_name, parent_folders_names);
//     // Spread Sheetを新規作成する
//     const ss_id = SpreadsheetApp.create(ss_name).getId();
//     // Spread SheetをFileオブジェクトとして取得する。
//     const file = DriveApp.getFileById(ss_id);
//     // 作成したフォルダ下にssを追加
//     DriveApp.getFolderById(folder_result.folder_id).addFile(file);
//     // ssをマイドライブから削除
//     DriveApp.getRootFolder().removeFile(file);

//     // 返り値を設定
//     output_obj.success = 1;
//     output_obj.folder_id = folder_result.folder_id;
//     output_obj.ss_id = ss_id;

//     return output_obj;
//   } catch (error) {
//     console.error(error);
//     throw (new Error(`${error.name}: ${error.message} @ createFolderAndSS`));
//   }
// }

async function addFolder(root_folder_id, new_folder_name, parent_folders_names = []) {
  try {
    let output_obj = { success: 0, folder_id: "" };

    const root_folder = await DriveApp.getFolderById(root_folder_id);
    // 親フォルダのチェック
    let parent_folder = root_folder;
    if (parent_folders_names != []) {
      for (const folder_name of parent_folders_names) {
        // フォルダ名で検索
        const folders = await parent_folder.searchFolders(`title contains "${folder_name}"`);
        if (folders.hasNext()) {
          // フォルダ名が一致するフォルダがある場合
          parent_folder = folders.next();
        } else {
          // ない場合、作成する
          await parent_folder.createFolder(folder_name);
          parent_folder = await parent_folder.getFoldersByName(folder_name).next();
        }
      }
    }
    // 目的のフォルダ下に新規フォルダを作成する
    const new_folder_id = await parent_folder.createFolder(new_folder_name).getId();

    output_obj.success = 1;
    output_obj.folder_id = new_folder_id;

    return output_obj;
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ addFolder`));
  }
}