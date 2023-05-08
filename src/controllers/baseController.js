const CryptoJS = require("crypto-js")
const serverConf = require("../../serverConf")

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