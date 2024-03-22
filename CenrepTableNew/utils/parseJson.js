export const parseJson = str => {
    try {
        return JSON.parse(str);
    }catch (e){
        return {}
    }
}