#!/usr/bin/env node --no-warnings
import { program } from "./commands.mjs";

program.parse(process.argv);
