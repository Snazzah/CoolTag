let cool = require("./index.js");
let tag = cool();
let brackettag = cool("[","]",":");

let functions = {
	time: new Date(),
	join: args => args.join(" "),
	red: args => "\u001b[31m"+args.join(" ")+"\u001b[39m",
	chain: args => args.join(";").split("_").map(a=>tag.parse(a,functions).string).join(" ")
};
tag.functions = brackettag.functions = functions;
tag.chainable = true;

console.log(tag.parse("The time right now is {time}.").string);
console.log(tag.parse("It's time to make the great \\{escape}!").string);
console.log(brackettag.parse("Maybe something [red:new]!").string);
console.log(tag.parse("You can even {join;esc\\}ape;in;tags}!").string);
console.log(tag.parse("You can even put {chain;{red;tags}_in_{red;tags}!}").string);