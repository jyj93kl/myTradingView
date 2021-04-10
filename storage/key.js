const uuid = require("uuid")
const crypto = require('crypto')
const sign = require('jsonwebtoken').sign
const queryEncode = require("querystring").encode

const approveAPI = {
	accessKey : "WFp08kxPXd20jhXmYAVv9exvAIx7zR6SLHJ8O9QU",
	secretKey : "YdhMItUyyJwxLX9ldMkYOML3fvdyXGZBVgEVuU1l"
}
const searchAPI = {
	accessKey : "zqsG29oyrPxN4AjqclCRU4hxPcvI6lpKG7xiING2",
	secretKey : "BYtx0sqjoWO5rjf25taFl8Pcl9rs7wHO7ocnCrnS"
}

function createToken(request){
    let payload = new Object()
    payload["access_key"] = searchAPI.accessKey
    payload["nonce"] = uuid.v4()
    if(request.queryString) {
        let query = queryEncode(request.queryString)
        let hash = crypto.createHash('sha512')
        let queryHash = hash.update(query, 'utf-8').digest('hex')
        payload["query_hash"] = queryHash
        payload["query_hash_alg"] = 'SHA512'
    }

    return 'Bearer '+ sign(payload, searchAPI.secretKey)
}

module.exports = {
    approve : approveAPI,
    search  : searchAPI,
    createToken : createToken
};