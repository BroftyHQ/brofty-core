import check_update from "./function/check_update.js";

(async()=>{
    await check_update();
    console.log("Update check completed.");
})();