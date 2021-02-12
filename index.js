const knex = require('knex')(require('./knexfile.js')['development']);
const Discord = require('discord.js')
const client = new Discord.Client()
const fetch = require('node-fetch')
const PREFIX = '!'

const addWin = (server, trainer) => {
    knex('trainer_tracker')
        .select('*')
        .where({ trainer: trainer })
        .then((t) => {
            let currentWins = t[0].wins
            knex('trainer_tracker')
                .where({server: server, trainer: trainer})
                .update({wins: currentWins + 1})
                .then(() => { })
        })
}

const getUserIdFromMessage = (message) => {
    if(message === undefined){
        return;
    }
    let msgArray = message.split('')
    msgArray.splice(0, 3)
    msgArray.pop()
    let parsedMessage = msgArray.join('')
    return parsedMessage;
}

const buyPokemon = async (trainer) => {
	let pokeCost = 10
	await knex('trainer_tracker')
		.select('*')
		.then((data) => {
			for(let i in data){
				knex('trainer_tracker')
					.select('money')
					.where({ trainer: trainer})
					.then((money) => {
						knex('trainer_tracker')
							.where({trainer: trainer})
							.update({money: money[0].money - pokeCost})
							.then(() => { console.log(`${trainer} bought a pokemon`) })
					})
                } 
            })
    }

const prize = (trainer) => {
    let dailyAmount = 20;
	knex('trainer_tracker')
		.select('*')
        .where({trainer: trainer})
		.then((data) => {
				knex('trainer_tracker')
					.select('money')
					.where({ trainer: data[0].trainer})
					.then((money) => {
						knex('trainer_tracker')
							.where({trainer: data[0].trainer})
							.update({ money: money[0].money + dailyAmount })
							.then(() => { console.log(`gave ${data[0].trainer} 20 PokeDollars`) })
					})
		})
}

const getCurrentPokemon = async (server, trainer) => {
    let pokeObject
    await knex('trainer_tracker')
        .select('*')
        .where({ server: server, trainer: trainer })
        .then( data => {
            pokeObject = data[0];
        })
        var dbpoke = new Discord.MessageEmbed()
        .setImage(pokeObject.sprite)
        .setTitle(`${pokeObject.trainer}'s PokeMon`)
        .addField('Name', pokeObject.name)
        .addField('Level:', pokeObject.level)
        .addField('HP:', pokeObject.health)
        .addField('Attack:', pokeObject.attack)
        .addField('Defence:', pokeObject.defence)
    
        return dbpoke;
    }

const killPokemon = (lossServer, loser) => {
    console.log('killing' + loser.trainer)
    fetch(`https://pokeapi.co/api/v2/pokemon/${Math.floor(Math.random() * (Math.floor(151) - Math.ceil(1)) + 1)}`)
        .then(response => response.json())
        .then(data => {
            
            let Level = Math.floor(Math.random() * (Math.floor(100) - Math.ceil(1)) + 1);
            let LevelScale = Level / 10;
            let date = new Date()
            let day = date.getDate();
            let myPokemon = {
                trainer: loser.trainer,
                name: data.name,
                sprite: data.sprites.front_default,
                stats: {
                    Level: Level,
                    Health: levelScale(data.stats[0].base_stat, LevelScale),
                    Attack: levelScale(data.stats[1].base_stat, LevelScale),
                    Defence: levelScale(data.stats[2].base_stat, LevelScale)
                },
                DayCaught: day
            }
            knex('trainer_tracker')
                .where({server: lossServer, trainer: loser.trainer})
                .update({
                name: 'dead', 
                sprite: null, 
                level: null, 
                health: null,
                attack: null,
                defence: null,
                day_caught: null})
                .then( () => {console.log(`${loser.trainer}'s pokemon died`)})
        })
}


const battle = (server, trainer1, trainer2) => {
    knex('trainer_traker')
        .select('*')
        .where({server: server, trainer: trainer1})
        .then( (poke1) => {
            knex('trainer_tracker')
            .select('*')
            .where({server: server, trainer: trainer2})
            .then((poke2) => {
                let pokemon1 = poke1[0]
                let pokemon2 = poke2[0]
                battleMath(pokemon1, pokemon2);
            })
        }) 
}

const battleMath = (server, poke1, poke2) => {
    let poke1ATK = Math.ceil((poke1.health + poke1.defence) / poke2.attack)
    let poke2ATK = Math.ceil((poke2.health + poke2.defence) / poke1.attack)
    //let totalOdds = poke1Odds + poke2Odds
    
    //let chance = Math.floor(Math.random() * (Math.floor(totalOdds) - Math.ceil(1)) + 1)
    let winningNumber = Math.floor(Math.random() * (Math.floor(10) - Math.ceil(1)) + 1)
    let bonusWinner
    let underDog
    if(poke1ATK > poke2ATK){
        bonusWinner = poke1
        underDog = poke2
    } else if(poke2ATK > poke1ATK){
        bonusWinner = poke2
        underDog = poke1
    } else {
        if(winningNumber <= 5){
            console.log('even win')
            killPokemon(server, poke2)
            return poke1
        }else {
            killPokemon(server, poke1)
            return poke2
        }
    } 

    

    if(winningNumber <= 7){
        //console.log('80 chance win' + winningNumber)
        killPokemon(server, underDog)
        return bonusWinner
    }else {
        //console.log('20 chance win' + winningNumber)
        killPokemon(server, bonusWinner)
        return underDog
    }
    // let fighters = [poke1ATK, poke2ATK]
    // let bonusWinner = Math.max(fighters)

    //console.log(bonusWinner)

}

//checks weather or not user has been added to db under that specific server
//returns true or false
const checkTrainerdb = (server, trainer) => {

    knex('trainer_tracker')
        .select('*')
        .where({server: server, trainer: trainer})
        .then((data) => {
            if(data.length === 0){
                return false;
            } else {
                return true;
            }
        })
    }

//addes the level scale to the pokemon's stats
const levelScale = (stat, levelScale) => {
    let scaledStat = Math.floor(stat + (stat * levelScale))
    return scaledStat
}


//Checks if the trainer has caught their pokemon on the current day - returns true or false
const pokemonCaughtToday = async (server, trainer) => {
    let day = new Date()
    let checkDay = day.getDate()
    let dayCaught
    //console.log(checkDay)

    await knex('trainer_tracker')
        .select('day_caught')
        .where({server: server, trainer: trainer})
        .then((day) => {
            dayCaught = day[0].day_caught
            if(checkDay == dayCaught){
                return true;
            } else {
                return false;
            }
        })
        
        //console.log(dayCaught);
        
}
const getYourPokemon = (trainer) => {
    for (var i of listOfTrainers){
        if(i.trainer === trainer){
            return i
        }
    }
}


client.login('ODA0MDI1NDMwMDcwOTE5MTk5.YBGVCA.yE6j8tnv746kfoO3hr5_P3Fp7Ew')

client.once('ready', () => {
    console.log('Logged In')
})

client.on('message', message => {
    let args = message.content.substring(PREFIX.length).split(' ');
    switch(args[0]){
        case 'catch':
            let currentTrainer = message.member.user.username
            let server = message.guild.id
            let day = new Date()
            let checkDay = day.getDate()
            let dayCaught
            
            knex('trainer_tracker')
                .select('*')
                .where({server: server, trainer: currentTrainer})
                .then((data) => {
                    if(data.length === 0){
						//if user does NOT exist in database
                        knex('trainer_tracker')
                            .insert([{server: server, trainer: currentTrainer, wins: 0}])
                            .then( () => { 
                                message.reply('Welcome new trainer!');
                                fetch(`https://pokeapi.co/api/v2/pokemon/${Math.floor(Math.random() * (Math.floor(151) - Math.ceil(1)) + 1)}`)
                                    .then(response => response.json())
                                    .then(data => {
                                        
                                        let Level = Math.floor(Math.random() * (Math.floor(100) - Math.ceil(1)) + 1);
                                        let LevelScale = Level / 10;
                                        let date = new Date()
                                        let day = date.getDate();
                                        let myPokemon = {
                                            trainer: currentTrainer,
                                            name: data.name,
                                            sprite: data.sprites.front_default,
                                            stats: {
                                                Level: Level,
                                                Health: levelScale(data.stats[0].base_stat, LevelScale),
                                                Attack: levelScale(data.stats[1].base_stat, LevelScale),
                                                Defence: levelScale(data.stats[2].base_stat, LevelScale)
                                            },
                                            DayCaught: day
                                        }
                                        knex('trainer_tracker')
                                            .where({server: server, trainer: currentTrainer})
                                            .update({ 
												trainer_id: message.author.id,
												money: 50,
												name: myPokemon.name, 
												sprite: myPokemon.sprite, 
												level: myPokemon.stats.Level, 
												health: myPokemon.stats.Health,
												attack: myPokemon.stats.Attack,
												defence: myPokemon.stats.Defence,
												day_caught: myPokemon.DayCaught })
                                            .then( () => {
                                                
                                                knex('trainer_tracker')
                                                    .select('*')
                                                    .where({ server: server, trainer: currentTrainer })
                                                    .then( data => {
                                                        let pokeObject = data[0];
                                                        var dbpoke = new Discord.MessageEmbed()
                                                            .setColor(10038562)
                                                            .setImage(pokeObject.sprite)
                                                            .setTitle(`${pokeObject.trainer}'s PokeMon`)
                                                            .addField('Name', pokeObject.name)
                                                            .addField('Level:', pokeObject.level)
                                                            .addField('HP:', pokeObject.health)
                                                            .addField('Attack:', pokeObject.attack)
                                                            .addField('Defence:', pokeObject.defence)
                                                        message.reply('This is your Pokemon!');
                                                        message.channel.send(dbpoke);
                                                    })
                                            })
                            })
                        })
                    }else{
						//User already exists in database
						
                        knex('trainer_tracker')
                        .select(['day_caught', 'name'])
                        .where({server: server, trainer: currentTrainer})
                        .then((data) => {
                            dayCaught = data[0].day_caught
							let pokeName = data[0].name
                            console.log(data[0])
                            if(checkDay === dayCaught){
								//checks if the pokemon was caught that same day
                                knex('trainer_tracker')
                                    .select('*')
                                    .where({ server: server, trainer: currentTrainer })
                                    .then( data => {
                                        let pokeObject = data[0];
                                        var dbpoke = new Discord.MessageEmbed()
                                            .setColor(10038562)
                                            .setImage(pokeObject.sprite)
                                            .setTitle(`${pokeObject.trainer}'s PokeMon`)
                                            .addField('Name', pokeObject.name)
                                            .addField('Level:', pokeObject.level)
                                            .addField('HP:', pokeObject.health)
                                            .addField('Attack:', pokeObject.attack)
                                            .addField('Defence:', pokeObject.defence)
                                        
                                        message.reply('This is your Pokemon');
                                        message.channel.send(dbpoke);
                                    })

                            } else if(pokeName === 'dead') {
                                console.log(pokeName)
								//pokemon was not caught that day and user is getting a new one
                                knex('trainer_tracker')
                                    .select('money')
                                    .where({server: server, trainer: currentTrainer})
                                    .then((data) => {
                                        if(data[0].money < 10){
                                            message.channel.reply('You do bot have enough money to buy a new pokemon')
                                        } else {
                                            message.reply('Your pokemon was defeated, here is a new one for $10');
                                            buyPokemon(currentTrainer)
                                            fetch(`https://pokeapi.co/api/v2/pokemon/${Math.floor(Math.random() * (Math.floor(151) - Math.ceil(1)) + 1)}`)
                                                .then(response => response.json())
                                                .then(data => {
                                                    
                                                    let Level = Math.floor(Math.random() * (Math.floor(100) - Math.ceil(1)) + 1);
                                                    let LevelScale = Level / 10;
                                                    let date = new Date()
                                                    let day = date.getDate();
                                                    let myPokemon = {
                                                        trainer: currentTrainer,
                                                        name: data.name,
                                                        sprite: data.sprites.front_default,
                                                        stats: {
                                                            Level: Level,
                                                            Health: levelScale(data.stats[0].base_stat, LevelScale),
                                                            Attack: levelScale(data.stats[1].base_stat, LevelScale),
                                                            Defence: levelScale(data.stats[2].base_stat, LevelScale)
                                                        },
                                                        DayCaught: day
                                                    }
                                                    knex('trainer_tracker')
                                                        .where({server: server, trainer: currentTrainer})
                                                        .update({server: server,
                                                        trainer: currentTrainer, 
                                                        name: myPokemon.name, 
                                                        sprite: myPokemon.sprite, 
                                                        level: myPokemon.stats.Level, 
                                                        health: myPokemon.stats.Health,
                                                        attack: myPokemon.stats.Attack,
                                                        defence: myPokemon.stats.Defence,
                                                        day_caught: myPokemon.DayCaught})
                                                        .then( () => {
                                                            
                                                            knex('trainer_tracker')
                                                                .select('*')
                                                                .where({ server: server, trainer: currentTrainer })
                                                                .then( data => {
                                                                    let pokeObject = data[0];
                                                                    var dbpoke = new Discord.MessageEmbed()
                                                                        .setColor(10038562)
                                                                        .setImage(pokeObject.sprite)
                                                                        .setTitle(`${pokeObject.trainer}'s PokeMon`)
                                                                        .addField('Name', pokeObject.name)
                                                                        .addField('Level:', pokeObject.level)
                                                                        .addField('HP:', pokeObject.health)
                                                                        .addField('Attack:', pokeObject.attack)
                                                                        .addField('Defence:', pokeObject.defence)
                                                                
                                                                    message.reply(dbpoke);
                                                                })
                                                        })
                                                })
                                        }
                                    })
                            } else if(checkDay !== dayCaught) {
									//buyPokemon(currentTrainer)
									message.channel.send('Here is your pokemon');
									fetch(`https://pokeapi.co/api/v2/pokemon/${Math.floor(Math.random() * (Math.floor(151) - Math.ceil(1)) + 1)}`)
										.then(response => response.json())
										.then(data => {
											
											let Level = Math.floor(Math.random() * (Math.floor(100) - Math.ceil(1)) + 1);
											let LevelScale = Level / 10;
											let date = new Date()
											let day = date.getDate();
											let myPokemon = {
												trainer: currentTrainer,
												name: data.name,
												sprite: data.sprites.front_default,
												stats: {
													Level: Level,
													Health: levelScale(data.stats[0].base_stat, LevelScale),
													Attack: levelScale(data.stats[1].base_stat, LevelScale),
													Defence: levelScale(data.stats[2].base_stat, LevelScale)
												},
												DayCaught: day
											}
											knex('trainer_tracker')
												.where({server: server, trainer: currentTrainer})
												.update({server: server,
												trainer: currentTrainer, 
												name: myPokemon.name, 
												sprite: myPokemon.sprite, 
												level: myPokemon.stats.Level, 
												health: myPokemon.stats.Health,
												attack: myPokemon.stats.Attack,
												defence: myPokemon.stats.Defence,
												day_caught: myPokemon.DayCaught})
												.then( () => {
													
													knex('trainer_tracker')
														.select('*')
														.where({ server: server, trainer: currentTrainer })
														.then( data => {
															let pokeObject = data[0];
															var dbpoke = new Discord.MessageEmbed()
                                                                .setColor(10038562)
																.setImage(pokeObject.sprite)
																.setTitle(`${pokeObject.trainer}'s PokeMon`)
																.addField('Name', pokeObject.name)
																.addField('Level:', pokeObject.level)
																.addField('HP:', pokeObject.health)
																.addField('Attack:', pokeObject.attack)
																.addField('Defence:', pokeObject.defence)
														
															message.reply(dbpoke);
														})
												})
										})
									
								}
                    })
                
            }
        })
        break;

    case 'battle':
        let trainer1 = message.member.user.username
        let trainer2 = args[1]
        let battleServer = message.guild.id
        let messageContent = args[1];
        let mentionUserId = getUserIdFromMessage(messageContent)
        knex('trainer_tracker')
            .select('*')
            .where({server: battleServer, trainer_id: mentionUserId})
            .then((t2) => {
                if(t2[0].trainer === trainer1){
                    message.reply("You can't battle yourself!")
                } else if(t2[0].name === 'dead'){
                    message.reply(`${t2[0].trainer} does not have a pokemon`)
                } else {
                    knex('trainer_tracker')
                        .select('*')
                        .where({server: battleServer, trainer: trainer1})
                        .then((t1) => {
                            if(t1[0].money === 0){
                                message.channel.reply(`${t1[0].trainer} is out of money`)
                            } else {
                                knex('trainer_tracker')
                                .select('*')
                                .where({server: battleServer, trainer: trainer1})
                                .then( (poke1) => {
                                    knex('trainer_tracker')
                                    .select('*')
                                    .where({server: battleServer, trainer_id: mentionUserId})
                                    .then((poke2) => {
                                        let pokemon1 = poke1[0]
                                        let pokemon2 = poke2[0]
                                        let winner = battleMath(battleServer, pokemon1, pokemon2);
                                        console.log(winner)
                                        knex('trainer_tracker')
                                            .select('*')
                                            .where({server: winner.server, trainer: winner.trainer})
                                            prize(winner.trainer);
                                        var winningMessage = new Discord.MessageEmbed()
                                            .setColor(10038562)
                                            .setImage(winner.sprite)
                                            .setTitle(`${winner.trainer} wins this battle`)
                                            .addField('Name', winner.name)
                                            .addField('Level:', winner.level)
                                            .addField('HP:', winner.health)
                                            .addField('Attack:', winner.attack)
                                            .addField('Defence:', winner.defence)

                                        addWin(battleServer, winner.trainer)                                  
                                        message.reply(winningMessage);
                                    // killPokemon(battleServer, loser)
                                    })
                                }) 

                            }
                        })
                }
            })
            .catch( () => {
                message.reply('This user has not joined the Game!')
            })
    break;

    case 'card':
        let trainerMention = args[1]
        let trainerUserId = getUserIdFromMessage(trainerMention)
        let tcServer = message.guild.id
        let tcTrainer = message.member.user.username
        if(trainerMention == undefined){
        knex('trainer_tracker')
            .select('*')
            .where({server: tcServer, trainer: tcTrainer})
            .then((trainer) => {
                
                if(trainer[0].name === 'dead'){
                    var trainerCard = new Discord.MessageEmbed()
                        .setColor(3447003)
                        .setTitle(`Trainer: ${trainer[0].trainer}`)
                        .addField('P$ (Money)', trainer[0].money)
                        .addField('Wins: ', trainer[0].wins)
                        .addField('pokemon:', 'None')
                                                        
                    message.reply(trainerCard);
                } else {
                    
                    var trainerCard = new Discord.MessageEmbed()
                        .setColor(3447003)
                        .setTitle(`Trainer: ${trainer[0].trainer}`)
                        .addField('P$ (Money)', trainer[0].money)
                        .addField('Wins: ', trainer[0].wins)
                        .addField('Pokemon', `${trainer[0].name}, Level: ${trainer[0].level}`)
                        .setImage(trainer[0].sprite)
                                                        
                    message.reply(trainerCard);
                }
            })
        } else {
            knex('trainer_tracker')
            .select('*')
            .where({server: tcServer, trainer_id: trainerUserId})
            .then((trainer) => {
                if(trainer[0].name === 'dead'){
                    var trainerCard = new Discord.MessageEmbed()
                        .setColor(3447003)
                        .setTitle(`Trainer: ${trainer[0].trainer}`)
                        .addField('P$ (Money)', trainer[0].money)
                        .addField('Wins: ', trainer[0].wins)
                        .addField('pokemon:', 'None')
                                                        
                    message.reply(trainerCard);
                } else {
                    
                    var trainerCard = new Discord.MessageEmbed()
                        .setColor(3447003)
                        .setTitle(`Trainer: ${trainer[0].trainer}`)
                        .addField('P$ (Money)', trainer[0].money)
                        .addField('Wins: ', trainer[0].wins)
                        .addField('Pokemon', `${trainer[0].name}, Level: ${trainer[0].level}`)
                        .setImage(trainer[0].sprite)
                                                        
                    message.reply(trainerCard);
                }
            })
            .catch( () => {
                message.reply('This user has not joined the Game!')
            })
        }
        break;

        case 'help':
            var commandsCard = new Discord.MessageEmbed()
                        .setColor(10038562)
                        .setTitle(`Poke Battle Manager Commands`)
                        .addField('!catch', 'This allows people to Enter the game for the first time or buy a new pokemon if yours has lost in battle for $10')
                        .addField('!battle', '@ someone who is in the game to battle their current PokeMon!')
                        .addField('!card', '@ someone to look at their current stats OR just do !card to view your own stats!')
                        .addField('!about', 'This is to view more information about the battle manager')
                        .addField('!updates', 'Find out what is currently being worked on')
                                                        
                    message.channel.send(commandsCard);
        break;

        case 'about':
            var aboutCard = new Discord.MessageEmbed()
                        .setColor(10038562)
                        .setTitle(`About Poke Battle Manager`)
                        .addField('Creator', 'Brian Avalos')
                        .addField('PokeMon Range', 'The first 151 Pokemon in the podex are availible for capture at a random level.')
                        .addField('Special Thanks', ' To Ivan and Damien for being the test Magikarps')
                                                        
                    message.channel.send(aboutCard);
        break;

        case 'updates':
            var aboutCard = new Discord.MessageEmbed()
                        .setColor(10038562)
                        .setTitle(`Features coming to Poke Battle Manager`)
                        .addField('Titles', 'Adding personalized Titles to add to your Trainer Cards for in-game money')
                        .addField('Pokemon Shop ', 'being able to buy specific pokemon at specific levels for a higher price than wild pokemon')
                        .addField('Better Combat System', 'working on a system to get better battle odds when fighting specific PokeMon types')
                                                        
                    message.channel.send(aboutCard);
        break;
    }})