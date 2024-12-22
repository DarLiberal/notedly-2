module.exports={
    //поиск заметок по юзеру, если у них автор тот кто указан и сортировка их от новых к старым
    notes: async (user,args,{models})=>{
        return await models.Note.find({author: user._id}).sort({_id:-1});
    },
    //показывает избранные заметки автора если он есть в массиве favoritedBy с айди авторов в заметке и сортировка
    favorites: async (user,args,{models})=>{
        return await models.Note.find({favoritedBy:user._id}).sort({_id:-1});
    }
};