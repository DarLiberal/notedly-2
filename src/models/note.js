//запрашиваем библиотеку mongoose
const mongoose=require('mongoose');

//определяем схему БД заметки
const noteSchema=new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        author: {
            type: String,
            required: true
        },
        favoriteCount:{
            type: Number,
            default:0
        },
        favoritedBy:[
            {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
            }
        ]
    },
    {
        //присваиваем поля createAd и updateAd с типом данных
        timestamps: true
    }
);

//определяем модель 'Note' со схемой
const Note=mongoose.model('Note',noteSchema);

//экспортируем модуль
module.exports=Note;