#!/usr/bin/env node

const fs = require('fs');

const command = process.argv.pop();

switch(command)
{
	case 'init':
		return require('../init');
	default:
		return require('../optimise');
}