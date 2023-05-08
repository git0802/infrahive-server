module.exports = {
  DBCONNECT: "mongodb://localhost:27017/apiinfra",
  ServerPort: 2000,
  BASEURL: __dirname + "/uploads/",
  DIR: __dirname,
  session: {
    expiretime: 1000 * 60 * 60,
  },
  site: "ApiInfra",
  Encrypt_Key:"apiinfra_key"
};