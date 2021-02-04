var sqlite3 = require("sqlite3").verbose();

const sleep = (n) => new Promise((res, rej) => setTimeout(res, n));

async function sql(dn,l){
	return new Promise((resolve,reject)=>{
		var db = new sqlite3.Database(dn);
		db.all(l,(err,row)=>{
			if(err){
				reject(err);
			}else{
				resolve(row)
			}
		});
	});
}

async function main(){
	grade = [2023]//,2022,2023];
	var item = await sql("password.db","select * from Password;")
	//console.log(item)
	ar = []
	for(i in grade){
		var rule = await sql("student.db","select * from Student where grade = "+grade[i]);
		var filted = item.filter(val=>rule.map(v=>v["id"]).includes(val["id"]));
		//console.log(grade[i],filted);
		var r = filted.map(val=>{
			var n = rule.filter(v=>v["id"]==val["id"])[0]["name"]
			//console.log(n)
			return [val["id"],n,val["passwd"],grade[i]]
		});
		//console.log(r)
		ar=ar.concat(r)
		
	}
	
	//console.log(ar)
	//await sql("P.db","insert into Password values ('a','a','a','a')")
	
	for(j in ar){
		val = ar[j];
		console.log(val)
		await sql("P.db","insert into Password values ('"+val.join("','")+"')")
		await sleep(2);
	}
}

main()