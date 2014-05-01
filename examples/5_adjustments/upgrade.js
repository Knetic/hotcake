// if we have an object named honeycrisp, and it's using the old version of the "seeds" field (which was just an int)
// then replace it with an array.
if(honeycrisp)
{
	if(typeof(honeycrisp.seeds) === "number")
		honeycrisp.seeds = new Array();
}