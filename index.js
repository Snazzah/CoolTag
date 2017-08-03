class CoolValue {
	constructor(context){ this.context = context; }
	value(ct){ return this.context.replace("%s%", ct.startchar.replace(/\\(.)/g, "$1")).replace("%e%", ct.endchar.replace(/\\(.)/g, "$1")).replace("%p%", ct.separator.replace(/\\(.)/g, "$1")); }
}

class CoolTag {
	constructor(startchar = "{", endchar = "}", separator = ";", allowedCharacters = new CoolValue("\\w")){
		if(separator.length > 1) throw new Error("Separators cannot have more than 1 character in a string!");
		if(startchar.length > 1) throw new Error("Starting characters cannot have more than 1 character in a string!");
		if(endchar.length > 1) throw new Error("Ending characters cannot have more than 1 character in a string!");
		this.separator = this.escape(separator);
		this.startchar = this.escape(startchar);
		this.endchar = this.escape(endchar);
		this.filterEscapes = true;
		this.chainable = false;
		this.functions = {};
		this.setAllowedCharacters(allowedCharacters);
	}

	setAllowedCharacters(allowedCharacters) {
		if(this.isCoolValue(allowedCharacters)){
			allowedCharacters = [allowedCharacters.value(this)];
		}else if(typeof allowedCharacters === 'string'){
			allowedCharacters = [this.escape(allowedCharacters)];
		}else{
			allowedCharacters = allowedCharacters.map(e => {
				if(typeof e !== 'string') throw new Error("Allowed characters must be a string!");
					else if(e.length > 1) throw new Error("Allowed characters cannot have more than 1 character in a string!");
					else if(this.isCoolValue(e)) return e.value(this);
					else return this.escape(e);
			});
		}
		this.allowedCharacters = allowedCharacters.length === 0 ? "" : "|"+allowedCharacters.join("|");
		return this;
	}

	isCoolValue(cv) { return cv.value && cv.context; }

	escape(str) { return str.replace(/[|\\{}()[\]^+*?.]/g, '\\$&'); }

	redefine(...a) { 
		let ct = new CoolTag(...a);
		ct.filterEscapes = this.filterEscapes;
		ct.chainable = this.chainable;
		ct.functions = this.functions;
		return ct;
	}

	parse(str, functions = this.functions, filterEscapes = this.filterEscapes, chainable = this.chainable) {
		//if(typeof tfunctions !== 'object' || !functions[final[0]]) functions = this.functions;
		const regex = new RegExp(`([^\\\\]|^)${this.startchar}(?::([^\\s]*)|)((\\w|${this.separator}|\\\\|\\\\${this.endchar}${chainable ? `|${this.endchar}|${this.startchar}` : ""}${this.allowedCharacters}|)+)([^\\\\${this.endchar}])${this.endchar}`);
		const globalRegex = new RegExp(regex.source,"g");
		const insideRegex = new RegExp(`(?!$)(?:^)?(([^${this.separator}])*)?(?:${this.separator})?(?:$)?`, "g");
		let matches = [];
		let cleanStr = str.replace(globalRegex, match => {
			// deal with inside contents
			let insideMatch = match.match(regex);
			let insideStr = `${insideMatch[3]}${insideMatch[5]}`;
			// locate args, reverse string, match, and re-reverse
			let args = insideStr.split("").reverse().join("").match(insideRegex).reverse().map(a=>a.split("").reverse().join(""));
			let final = [];
			args.map(a => {
				let i = args.indexOf(a);
				if(!args[i]) return;
				if(final[i]) a = final[i];
				if(!a) return;
				if(a.endsWith("\\") && i !== args.length-1){
					a = a+args[i+1];
					final[i+1] = a;
					delete final[i];
					final[i] = undefined;
					return;
				}
				if(i !== 0 && a.startsWith(this.separator)){
					a = a.split("").slice(1).join("");
				}
				final[i] = a;
			});
			final = final.filter(e => typeof e !== 'undefined');
			if(this.filterEscapes) final = final.map(a => a.replace(new RegExp(`\\\\${this.separator}`, "g"), this.separator));
			matches.push(final);
			if(typeof functions !== 'object' || !functions[final[0]]) return insideMatch[1];
			if(typeof functions[final[0]] !== "function") return insideMatch[1]+functions[final[0]].toString();
			let result = functions[final[0]](final.slice(1));
			if(result === undefined || result === null) return insideMatch[1]; else return insideMatch[1]+result.toString();
		});
		if(filterEscapes) cleanStr = cleanStr.replace(/\\(.)/g, "$1");
		return {
			string: cleanStr,
			matches: matches
		};
	}
}

module.exports = (...a) => new CoolTag(...a);
module.exports.tag = CoolTag;
module.exports.value = CoolValue;
module.exports.ANY = new CoolValue("[^%s%%e%]");
module.exports.ANY_NO_NEWLINES = new CoolValue("[^%s%%e%\\n]");
module.exports.NEWLINE = new CoolValue("\\n");
module.exports.WORDS = new CoolValue("\\w");
module.exports.NON_WORDS = new CoolValue("\\W");
module.exports.DIGITS = new CoolValue("\\d");
module.exports.NON_DIGITS = new CoolValue("\\D");
module.exports.WHITESPACE = new CoolValue("\\s");
module.exports.NON_WHITESPACE = new CoolValue("\\S");