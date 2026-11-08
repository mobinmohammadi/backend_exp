const { Schema, model } = require("mongoose")

const categorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: 'admin.png'
    },
    slug: {
        type: String,
        default: 'admin'    
    }
}, {timestamps : true})

categorySchema.index({
    name : 'text'
})

module.exports = model("categorys", categorySchema)