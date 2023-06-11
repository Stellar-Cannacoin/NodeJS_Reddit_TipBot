const axios = require("axios");
const moment = require("moment");

const reddit = require('../libs/reddit');
const { recordPost, fetchRewardPostStats, fetchRewardStats } = require("../libs/db");
const { collectKarma, karmaPayout } = require("../libs/cron");



// test('listRedditPosts', () => {
//     return listRedditPosts().then(async (data) => {
//         // console.log(data)
//         expect(Array.isArray(data)).toBe(true)
//     });
// })


const listRedditPosts = () => {
    return new Promise(resolve => {
        axios.get('https://old.reddit.com/r/stellarcannacoin/new/.json')
        .then(({data}) => {
            data.data.children.map(async (item, index) => {
                let post_date = moment(item.data.created_utc*1000).format('DD.MM.Y')
                console.log(item.data.author, `${item.data.score} ${post_date}`)
                // console.log(item.data.id, item.data.score)
                let post = {
                    id: item.data.id, 
                    title: item.data.title,
                    score: item.data.score,
                    user: item.data.author,
                    ups: item.data.ups,
                    downs: item.data.downs,
                    ts: new Date(item.data.created*1000)
                }
                recordPost(post)

                setTimeout(async function () {
                    try {
                        let comments = await reddit.getComments(post.id);

                        if (!Array.isArray(comments)) {
                            return
                        }
                        comments.map(comment => {
                            let upvotes = comment.ups-comment.downs

                            let post = {
                                id: comment.id,
                                title: "comment",
                                score: upvotes,
                                user: comment.author.name,
                                ups: comment.ups,
                                downs: comment.downs,
                                ts: new Date(comment.created*1000)
                            }
                            if (post.user == "[deleted]") {
                                return false
                            }
                            recordPost(post)
                            // storeDailyScore(commentmeta)
                            return true
                        })
                        return true
                    } catch (error) {
                        console.log(error)
                    }
                }, 2000*index);
            })
            resolve(data.data.children)
            
        })
    })
}

// listRedditPosts()
// collectKarma()
karmaPayout()
const pullData = () => {
    fetchRewardStats()
    .then(data => {
        console.log(data)
    })
    fetchRewardPostStats()
    .then(data => {
        console.log(data)
    })
}
// pullData()