module.exports={
    //для заметок позволяем возвращать данные об авторе через айди из заметки
    author: async(note,args,{models})=>{
        return await models.User.findById(note.author);
    },
    //для заметок позволяем возвращать данные о тех у кого она в избранном делая поиск юзеров из всех тех у кого есть айди в избранном
    favoritedBy: async(note,args,{models})=>{
        return await models.User.find({_id:{$in: note.favoritedBy}});
    }
};