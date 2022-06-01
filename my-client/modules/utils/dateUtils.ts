export function convertDate(date: Date, pattern: string = 'yyyy-MM-ddThh:mm:ss') {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    //replace the month
    pattern = pattern.replace("MM", month.toString().padStart(2,"0"));

    //replace the year
    if (pattern.indexOf("yyyy") > -1) {
        pattern = pattern.replace("yyyy", year.toString());
    } else if (pattern.indexOf("yy") > -1) {
        pattern = pattern.replace("yy", year.toString().substr(2,2));
    }

    //replace the day
    pattern = pattern.replace("dd", day.toString().padStart(2,"0"));

    //replace the hour, minute, second
    pattern = pattern.replace("hh", hour.toString().padStart(2, "0"))
    pattern = pattern.replace("mm", minute.toString().padStart(2, "0"))
    pattern = pattern.replace("ss", second.toString().padStart(2, "0"))

    return pattern;
}
