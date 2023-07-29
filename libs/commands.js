const getTipAmount = (string) => {
    let regex = /!canna2v|!canna ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[1]
}
const getWalletAddress = (string) => {
    let regex = /send ([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))? ([A-Za-z0-9\/_-]+)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[3]
}
const getAmountFromCommand = (string) => {
    // let regex = /([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?/
    let regex = /([+-]?(?=\.\d|\d)(?:\d+)?(?:\.?\d*))(?:[Ee]([+-]?\d+))?|all/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[0]
}
const getBotCommand = (string) => {
    let regex = /(!canna2v?|!canna?|balance|Balance|send?|Send?|deposit|Deposit|leaderboard|Leaderboard|help|Help|Optin|optin|Optout|optout)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)[0]
}

const getBotCommandFull = (string) => {
    let regex = /(!canna2v?|!canna?|balance|Balance|send?|Send?|deposit|Deposit|leaderboard|Leaderboard|help|Help|Optin|optin|Optout|optout)/
    if (!string.match(regex)) {
        return false
    }
    return string.match(regex)
}

module.exports = {
    getWalletAddress,
    getAmountFromCommand,
    getTipAmount,
    getBotCommand,
    getBotCommandFull
}