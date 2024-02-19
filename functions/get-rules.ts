const axios = require("axios");
const fs = require('fs');

const cacheFilePath = './gar-information/rules_trello.json';

function writeCache(data) {
    try {
      fs.writeFileSync(cacheFilePath, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }


  function extractOffenseData(card, listName) {
    const ignoreLists = ['Factions Information & Rules', 'Information'];
  
    if (ignoreLists.includes(listName)) {
      return null;
    }
  
    const regex = /^(.*?)\n---\n\n### Punishments:\n\n(.*)/s;
    const matches = card.desc.match(regex);
  
    if (matches) {
      const description = matches[1].trim().replace(/\n/g, ' '); 
      const punishments = matches[2]
        .trim()
        .split('\n')
        .filter((punishment) => punishment.startsWith('-'))
        .map((punishment) => punishment.trim().replace('-', '').replace(/\n/g, ''));
  
      return {
        Classification: listName,
        Description: description,
        Punishments: punishments,
        Url: card.shortUrl,
      };
    }
    return null;
  }
  
  

async function updateCache() {
    try {
      console.log('Updating cache from Trello...');
      const response = await axios.get(
        'https://trello.com/b/VB1W7b6x/gar-republic-laws.json'
      );
    const cards = response.data.cards;
    const lists = response.data.lists;

    const ignoreLists = ['Factions Information & Rules', 'Information'];

    let cachedData = {
        timestamp: Date.now(),
        MinorOffenses: {},
        MediumOffenses: {},
        HighOffenses: {},
      };

    for (const list of lists) {
        const listName = list.name;
        const category = listName === 'Medium Offenses' ? 'MediumOffenses' : listName === 'High Offenses' ? 'HighOffenses' : 'MinorOffenses';

        if (ignoreLists.includes(listName)) {
          continue
        }

        for (const card of cards) {
          if (card.name == listName) {
            continue
          }
            if (card.idList === list.id){
                const offenseData = extractOffenseData(card, listName);
                cachedData[category][card.name] = offenseData;
                
            }
        }
    }
    writeCache(cachedData)
    console.log('Cache updated successfully!');
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }

  function readCache() {
    try {
      return JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
    } catch (error) {
      console.error('Error reading cache:', error);
      if (!fs.existsSync(cacheFilePath)) {
        console.log('Cache file not found, creating a new one.');
        updateCache()
      }
      return null;
    }
  }
  
  async function getCard(card_name) {
    const cachedData = readCache();
    const aliasList = "./gar-information/rules_trello.json"

    for (const category of ['MinorOffenses', 'MediumOffenses', 'HighOffenses']) {
      if (cachedData[category][card_name]) {
        const offenseData = cachedData[category][card_name];
        console.log(offenseData)
        return offenseData; 
      }
    }
    return null; 
  }

getCard('Conspiracy - [1st Degree]')