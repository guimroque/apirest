const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require('jsonwebtoken');


const JWTSecret = 'supersecreto';
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//middleware de permissão de acesso as rotas
function auth(req, res, next){
    const authToken = req.headers['authorization'];//pegando token 

    if(authToken != undefined){//se o token for recebido

        const bearer = authToken.split(' ');//separa token em duas partes, tirando o bearer
        var token = bearer[1];

        jwt.verify(token,JWTSecret,(err, data) => {//verifica se o token gerado é valido
            if(err){//caso a função assincrona retorne um erro
                res.status(401);
                res.json({err:"Token inválido!"});
            }else{//caso nao retorne 

                req.token = token;
                req.loggedUser = {id: data.id,email: data.email};
                req.empresa = "Guilherme Games";                
                next();
            }
        });
    }else{//caso token nao seja recebido
        res.status(401);
        res.json({err:"Token inválido!"});
    } 
}
//banco de dados ficticio para testes
var DB = {
    games: [//tabela de games
        {
            id: 23,
            title: "Call of duty MW",
            year: 2019,
            price: 60
        },
        {
            id: 65,
            title: "Sea of thieves",
            year: 2018,
            price: 40
        },
        {
            id: 2,
            title: "Minecraft",
            year: 2012,
            price: 20
        }
    ], 
    users: [//tabela de usuarios
        {
            id:1,
            name: 'Guilherme Miguel Roque',
            email: 'guilherme@gmail.com',
            password:'1234'
        },

        {
            id:3,
            name: 'Maria',
            email: 'maria@gmail.com',
            password:'5678'
        }
    ]
}

//rota de autenticação, onde verifica dados do BD e gera token
app.post("/auth",(req, res) => {

    var {email, password} = req.body;

    if(email != undefined){//verifica se o email foi recebido

        var user = DB.users.find(u => u.email == email);
        if(user != undefined){//verifica se o email é o mesmo salvo no BD
            if(user.password == password){//confere se a senha é igual a salva no BD
                jwt.sign({id: user.id, email: user.email},JWTSecret,{expiresIn:'48h'},(err, token) => {//gera token, usando senha da aplicação 'JWTSecret'
                    if(err){//verifica se o token foi gerado, caso haja algum erro
                        res.status(400);
                        res.json({err:"Falha interna"});
                    }else{//caso o token seja gerado ele é retornado 
                        res.status(200);
                        res.json({token: token});
                    }
                })
            }else{//caso a senha nao seja igual do BD
                res.status(401);
                res.json({err: "Credenciais inválidas!"});
            }
        }else{//caso email recebido nao exista no BD
            res.status(404);
            res.json({err: "O E-mail enviado não existe na base de dados!"});
        }

    }else{//caso email nao tenha sido recebido
        res.status(400);
        res.send({err: "O E-mail enviado é inválido"});
    }
});
//rota que lista jogos
app.get("/games",(req, res) => {
    res.statusCode = 200;
    res.json(DB.games);
});
//rota que lista jogo pelo id
app.get("/game/:id",(req, res) => {
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        
        var id = parseInt(req.params.id);

        var game = DB.games.find(g => g.id == id);

        if(game != undefined){
            res.statusCode = 200;
            res.json(game);
        }else{
            res.sendStatus(404);
        }
    }
});
//rota que adiciona jogo
app.post("/game", auth ,(req, res) => {//rota passa pelo middleware 'auth' antes de ser acessada 
    var {title, price, year} = req.body;
    DB.games.push({
        id: 2323,
        title,
        price,
        year
    });
    res.sendStatus(200);
})
//rota que deleta jogo
app.delete("/game/:id", auth ,(req, res) => {//passa pelo middleware antes de ser acessado
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        var id = parseInt(req.params.id);
        var index = DB.games.findIndex(g => g.id == id);

        if(index == -1){
            res.sendStatus(404);
        }else{
            DB.games.splice(index,1);
            res.sendStatus(200);
        }
    }
});
//rota de edição de jogo
app.put("/game/:id", auth, (req, res) => {//antes da rota ser acessada passa pelo middleware 'auth'

    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        
        var id = parseInt(req.params.id);

        var game = DB.games.find(g => g.id == id);
        //validações 
        if(game != undefined){

            var {title, price, year} = req.body;

            
            if(title != undefined){
                game.title = title;
            }

            if(price != undefined){
                game.price = price;
            }

            if(year != undefined){
                game.year = year;
            }
            
            res.sendStatus(200);

        }else{
            res.sendStatus(404);
        }
    }

});

app.listen(5000,() => {
    console.log("API RODANDO!");
});