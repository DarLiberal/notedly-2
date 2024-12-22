const { models } = require("mongoose");

module.exports = {
        
    //вывод всех заметок из базы данных
    notes: async (parent,args,{models})=>{
        return await models.Note.find();
    },

    //вывод заметок по айди
    note: async (parent,args,{models})=>{
        return await models.Note.findById(args.id);
    },

    //ищем пользователя по имени
    user: async(parent,{username},{models})=>{
        //возвращаем юзера, которого нашли по его имени
        return await models.User.findOne({username});
    },

    //ищем всех юзеров и их выводим
    users: async(parent,args,{models})=>{
        return await models.User.find({});
    },

    //возвращаем информацию о текущем пользователе
    me: async(parent,args,{models,user})=>{
        //ищем его в бд по айди через которого зашли
        return await models.User.findById(user.id);
    },

    //запрос пагинации по достижении значения курсора
    noteFeed: async (parent,{cursor},{models})=>{

        //устанавливаем лимит пагинации
        const limit=10;

        //проверка на то будет ли пагинация дальше, по умолчанию нет (false)
        let hasNextPage = false;

        //если у нас еще не было курсора, то по умолчанию запрос пустой в таком случае будут выведены последние заметки
        let cursorQuery={};

        //если задан курсор, то мы будем искать заметки со значениями objectId меньше чем этот курсор, т е до него
        if(cursor) {
            cursorQuery={_id:{$lt: cursor}};
        }

        //поиск заметок в БД по айди которые указаны в cursorQuery (айди меньше чем курсор, т е до него)
        let notes = await models.Note.find(cursorQuery)
            //сортируем заметки из БД от новых к старым
            .sort({_id:-1})
            //находим в БД limit+1 количество заметок (10 + 1) то есть 11 для проверки на наличие следующей заметки для следующей страницы пагинации
            .limit(limit+1);

        //если число найденных заметок больше чем лимит, то устанавливаем hasNextPage на true и обрезаем заметки до лимита
        if(notes.length>limit){
            //устанавливаем hasNextPage на true так как далее будет еще одна страница
            hasNextPage=true;
            //обрезаем заметки до лимита (то есть с 11 (-1) до 10, до лимита) (это только в условии 10 а не 11)
            notes=notes.slice(0,-1);
        }

        //новый курсор будет id mongo-объекта последнего элемента массива списка (считаются с 11 заметок и считается длина -1 т е 11 - 1 = 10) 
        //т е айди 10 заметки будет новым курсором для новой страницы заметок
        const newCursor=notes[notes.length-1]._id;

        //возвращаем заметки, курсор в новом значении и значение показывающее наличие следующей страницы заметки
        return {
            notes,
            cursor: newCursor,
            hasNextPage
        };
    }

}