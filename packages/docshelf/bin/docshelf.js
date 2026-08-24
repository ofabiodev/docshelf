#!/usr/bin/env node
import { run } from "../build/cli.js";

process.exitCode = await run(process.argv.slice(2));
