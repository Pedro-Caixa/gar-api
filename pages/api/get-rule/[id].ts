import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import { getCardsInList, getCard } from "../../../functions/get-blacklists"
