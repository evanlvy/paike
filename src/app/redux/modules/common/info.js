export const DATA_EXPIRATION_TIME = 3600*1000;  // one hour

export const formatDate = (current_datetime)=>{
    let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds();
    return formatted_date;
}

export const allInChinese = (str) => {
    var reg=/^[\u4E00-\u9FA5]+$/;
    if(!reg.test(str)){
        // Not all in Chinese
        return false;
    }
    // All in Chinese 
    return true; 
}

/**
 * Translate dataframe to table object.
 *
 * @param df_obj input dataframe object, contains below keys:
 *         dfcol, ---[rows in dataframe]progress items col array ["id","name","email"]
 *         dfdata, ---[rows in dataframe]progress items rows data ["6","Danny","danny@kebiao.xyz"]
 * @return out output with object array 
 */
export const convertDFtoArray = (df_obj) => {
    let col = df_obj['dfcol'];
    let data = df_obj['dfdata'];
    return data.map(item => {
        const out = col.reduce((acc, key, i) => ({ ...acc, [key]: item[i] }), {});
        //item.forEach((element, index) => {
        //    out[col[index]] = element;
        //});
        return out;
    });
}