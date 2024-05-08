class Shuffler {
    constructor(objectsArray) {
      this.objectsArray = objectsArray;

    //   const len = objectsArray.length;
      this.objectWeights = objectsArray.reduce((map, object) => {
        map.set(object, 1); // initialise all weights as 1.
        return map;
      }, new Map());
    }
  
    getWeights() {
        return this.objectWeights;
    }

    getTotalWeight() {
        return Array.from(this.objectWeights).reduce((sum, [object, weight]) => sum + weight, 0)
    }

    getRandomObject() {
        if (this.getTotalWeight() === 0) {
            throw new Error("entries have no weight.");
        }
        let k = Math.random() * this.getTotalWeight();
        let accumulant = 0;
        for (const [object, weight] of this.objectWeights) {
            accumulant += weight;
            if (k <= accumulant) {
                // console.log(`${k} less than ${accumulant}, returning ${object}`);
                return object
            }
        } 
        throw new Error("k larger than maximum");
    }

    /**
     * Gets random object, assuming uniform distribution (ignoring stored weights).
     */
    getRandomObjectFair() {
        let k = Math.random() * this.objectWeights.size;
        let accumulant = 0;
        for (const object of this.objectWeights.keys()) {
            accumulant += 1;
            if (k <= accumulant) {
                return object;
            }
        } 
    }

    setWeights(weightsMap) {
        let s = new Set(weightsMap.keys());
        let t = new Set(this.objectWeights.keys())
        if (!(s.size === t.size && [...s].every((x) => t.has(x)))) {
            console.error("s:");
            for (const element of s) {
                console.error(element);
            } 
            console.error("t:");
            for (const element of t) {
                console.error(element);
            } 

            throw new Error(`
                the provided map does not match the stored map
                s size: ${s.size} t size: ${t.size}

            `);
        }
        for (const [object, weight] of weightsMap) {
            this.objectWeights.set(object, weight);
        } 
    }
}
  
function myFunction() {
    console.log('This is a function from myModule');
}

module.exports = {
    Shuffler,
    myFunction
};

function main() {
    const s = new Shuffler(['a', 'b', 'c', 'd']);
    // console.log(s.get_total_weight());
    s.getRandomObject();
    s.getRandomObject();
    s.getRandomObject();
    s.getRandomObject();
    s.getRandomObject();
    s.setWeights(new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
        ['d', 4],
    ]))
    try {
        s.setWeights(new Map([
            ['a', 1],
            ['b', 2],
            ['c', 3],
            ['k', 4],
        ])) 
    } catch {
        console.log('wrong weights map');
    }
    console.log(s.getTotalWeight());
}

main();

