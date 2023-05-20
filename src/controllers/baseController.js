const CryptoJS = require("crypto-js");
const md5 = require("md5");
const serverConf = require("../../serverConf");
const moment = require('moment-timezone')
exports.encrypt = (text) => {
    try {
        const ciphertext = CryptoJS.AES.encrypt(text, serverConf.Encrypt_Key).toString()
        return `${ciphertext}`
    } catch (err) {
        console.error({ title: "encrypt", message: err.message, time: new Date() })
    }
}

exports.decrypt = (hash) => {
    try {
        const bytes = CryptoJS.AES.decrypt(hash, serverConf.Encrypt_Key)
        const originalText = bytes.toString(CryptoJS.enc.Utf8)
        return originalText
    } catch (err) {
        console.error({ title: "decrypt", message: err.message, time: new Date() })
    }
}
exports.signAccessToken = (req, res, email) => {
    try {
        // if (email) {
        const expiration = getSessionTime();
        const accessToken = md5(email + expiration);
        return { email, accessToken };
        // }
    } catch (err) {
        console.error({ title: "signAccessToken", message: err.message, time: new Date() })
    }
};
const getSessionTime = () => {
    const time = new Date(new Date().valueOf() + parseInt(serverConf.session));
    return moment.tz(time, process.env.TIME_ZONE);
};