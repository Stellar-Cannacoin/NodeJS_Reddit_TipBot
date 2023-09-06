const { listUsers } = require("../libs/db")
const fs = require('fs')

test('fetch users', async () => {
    return listUsers().then(async (data) => {
        console.log(data)
        // fs.writeFileSync('./debug/users.json', JSON.stringify(data))
        fs.writeFileSync('__tests__/debug/users.json', JSON.stringify(data))
        expect(Array.isArray(data)).toBe(true)
    });
})