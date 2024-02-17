import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import noblox from 'noblox.js';

let isInGar = false;

function readJSON(path: string): any {
  const info = fs.readFileSync(path, 'utf-8');
  return JSON.parse(info);
}
const garDivisions = readJSON('gar-information/divisions.json');
const divisionRanks = readJSON('gar-information/division-officers.json');

function checkOfficer(groupRank: number, divisions: any, userDivisionName: string): { isOfficer: boolean; isHICOM: boolean } {
  let isOfficer = false;
  let isHICOM = false;

  if (divisions.hasOwnProperty(userDivisionName)) {
    const divisionRanksForDivision = divisions[userDivisionName];

    for (const rankStr in divisionRanksForDivision) {
      const rankNumber = parseInt(rankStr, 10);

      if (groupRank >= rankNumber) {
        const rankRole = divisionRanksForDivision[rankStr];
        
        if (rankRole === "Officer") {
          isOfficer = true;
        } else if (rankRole === "HICOM") {
          isHICOM = true;
          break; 
        }
      }
    }
  }
  return { isOfficer, isHICOM };
}
type ResponseData = {
  username: string;
  isInGar: boolean;
  divisions:
    | ({ divisionName: string; isHICOM: boolean; isOfficer: boolean; rank: number; })[]
    | Record<string, { isOfficer: boolean; isHICOM: boolean; rank: number; }>;
};

let response: ResponseData | undefined;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const userId = parseInt(req.query.id as string);
  const robloxUsername = await noblox.getUsernameFromId(userId);
  const groups = await noblox.getGroups(userId);

  for (const group of groups) {
    if (group.Id === 5214183) {
      isInGar = true;
      break;
    }
  }

  if (isInGar && garDivisions.divisions && typeof garDivisions.divisions === 'object') {
    const divisions: Record<string, { isOfficer: boolean; isHICOM: boolean; rank: number }> = {};

    for (const divisionId in garDivisions.divisions) {
      if (garDivisions.divisions.hasOwnProperty(divisionId)) {
        const divisionName = garDivisions.divisions[divisionId];
        const group = groups.find(group => group.Id === parseInt(divisionId));

        if (group) {
          const { isOfficer, isHICOM } = checkOfficer(group.Rank, divisionRanks, divisionName);
          divisions[divisionName] = { isOfficer, isHICOM, rank: group.Rank };
        }
      }
    }
    console.log(await noblox.getRoles(5352039))
    if (Object.keys(divisions).length > 0) {
      response = {
        username: robloxUsername,
        isInGar: isInGar,
        divisions,
      };
    }
  }

  if (response) {
    res.status(200).json(response);
  }
}
