"""Hangman rules shared by the terminal and browser interfaces."""

import string

HANGMAN_PICS = (
    " +---+\n     |\n     |\n     |\n    ===",
    " +---+\n O   |\n     |\n     |\n    ===",
    " +---+\n O   |\n |   |\n     |\n    ===",
    " +---+\n O   |\n/|   |\n     |\n    ===",
    " +---+\n O   |\n/|\\  |\n     |\n    ===",
    " +---+\n O   |\n/|\\  |\n/    |\n    ===",
    " +---+\n O   |\n/|\\  |\n/ \\  |\n    ===",
)

DIFFICULTY = {
    "easy": {
        "words": [
            "acorn", "actor", "apple", "apron", "arrow", "aunt", "baby", "bacon",
            "badge", "bag", "baker", "ball", "band", "bank", "barn", "basin", "bat",
            "bath", "beach", "bead", "beam", "bean", "bear", "bed", "bee", "beef",
            "bell", "belt", "bench", "berry", "bike", "bird", "birth", "blade", "blank",
            "blast", "block", "bloom", "blue", "board", "boat", "body", "bone", "book",
            "boot", "bowl", "box", "brain", "bread", "brick", "bride", "broom", "brush",
            "bug", "bun", "bunny", "bus", "bush", "cabin", "cage", "cake", "camel",
            "camp", "can", "candy", "cape", "card", "cart", "cat", "cave", "chain",
            "chair", "chalk", "cheek", "cheer", "chess", "chick", "chief", "child",
            "chin", "chip", "clam", "clap", "class", "clay", "clean", "cliff", "clock",
            "cloud", "clown", "club", "coach", "coast", "coat", "coin", "cold", "comb",
            "cook", "corn", "couch", "cow", "crab", "craft", "crane", "crash", "cream",
            "creek", "crest", "crow", "crown", "cube", "cup", "curve", "dance", "dawn",
            "day", "deer", "desk", "dice", "dish", "dock", "dog", "doll", "door",
            "dove", "draft", "drain", "dream", "dress", "drill", "drink", "drive",
            "drop", "drum", "duck", "dust", "eagle", "ear", "earth", "east", "edge",
            "egg", "eight", "elbow", "elf", "face", "fact", "fairy", "fall", "farm",
            "feast", "feed", "fence", "fern", "field", "fig", "fin", "fire", "fish",
            "flag", "flame", "flash", "flat", "fleet", "flesh", "float", "flock",
            "flood", "floor", "flour", "flute", "fly", "foam", "fog", "fold", "food",
            "foot", "fork", "fort", "fox", "frame", "frog", "frost", "fruit", "fun",
            "fur", "game", "gate", "gem", "gift", "girl", "glass", "glove", "glue",
            "goat", "gold", "goose", "gown", "grape", "grass", "green", "grill", "grin",
            "grip", "grove", "grow", "guard", "guest", "guide", "gum", "hair", "half",
            "hall", "hand", "hare", "harp", "hat", "hay", "head", "heart", "heat",
            "heel", "hen", "herb", "hill", "hive", "hog", "hole", "home", "honey",
            "hook", "horn", "horse", "hose", "hotel", "house", "hug", "hut", "ice",
            "ink", "iron", "ivory", "jam", "jar", "jaw", "jazz", "jelly", "jewel",
            "job", "joke", "juice", "key", "kick", "kid", "king", "kite", "knee",
            "knife", "knot", "lace", "lake", "lamb", "lamp", "land", "lane", "lap",
            "leaf", "leg", "lemon", "lid", "light", "lime", "line", "lion", "lip",
            "list", "loaf", "lock", "log", "lunch", "lung", "magic", "mail", "map",
            "mask", "match", "maze", "meal", "meat", "melon", "metal", "milk", "mint",
            "mist", "moon", "moss", "mouse", "mouth", "mud", "mug", "nail", "name",
            "neck", "nest", "net", "newt", "night", "noise", "north", "nose", "nurse",
            "nut", "oak", "ocean", "onion", "otter", "owl", "page", "paint", "palm",
            "panda", "pants", "paper", "park", "path", "paw", "peach", "pearl", "peas",
            "pen", "penny", "pet", "piano", "pie", "pig", "pilot", "pine", "pink",
            "pipe", "pizza", "place", "plain", "plane", "plant", "plate", "play",
            "plum", "pond", "pool", "porch", "pot", "pouch", "prize", "puppy", "queen",
            "quilt", "race", "rain", "rake", "rat", "red", "reed", "reef", "ring",
            "river", "road", "robin", "rock", "roof", "room", "root", "rope", "rose",
            "round", "row", "ruby", "rug", "ruler", "sail", "salad", "salt", "sand",
            "scarf", "seal", "seed", "shade", "shake", "shark", "sheep", "sheet",
            "shell", "ship", "shirt", "shoe", "shop", "shore", "short", "shout",
            "shrub", "side", "silk", "sing", "sink", "skate", "ski", "skin", "skirt",
            "sky", "sled", "sleep", "slice", "slide", "slime", "slope", "small",
            "smile", "smoke", "snail", "snake", "snow", "soap", "sock", "sofa", "soil",
            "song", "sound", "soup", "south", "space", "spade", "spark", "spear",
            "speed", "spice", "spoon", "sport", "spot", "spray", "spy", "stage",
            "stair", "stamp", "star", "steam", "steel", "stem", "stick", "stone",
            "stool", "storm", "stove", "straw", "sugar", "suit", "sun", "sunny", "swan",
            "sweet", "swing", "table", "tail", "tank", "tap", "tea", "team", "tent",
            "thumb", "tide", "tiger", "tile", "time", "toast", "toe", "tool", "tooth",
            "torch", "towel", "town", "toy", "track", "trail", "train", "tray", "treat",
            "tree", "trick", "truck", "trunk", "tub", "tulip", "tune", "twig", "twins",
            "uncle", "vase", "vest", "vine", "voice", "vote", "wagon", "wall", "wasp",
            "watch", "water", "wave", "wax", "web", "whale", "wheat", "wheel", "whip",
            "white", "wind", "wing", "witch", "wolf", "wood", "wool", "world", "worm",
            "yard", "yarn", "yawn", "year", "yeast", "yolk", "young", "zebra", "zoo",
        ],
        "max_attempts": 10,
    },
    "medium": {
        "words": [
            "absent", "absorb", "accent", "accept", "access", "accord", "acrobat",
            "across", "action", "active", "admire", "advice", "afraid", "agency",
            "airport", "almond", "almost", "anchor", "animal", "annual", "answer",
            "antler", "anyone", "anyway", "appeal", "appear", "arcade", "archer",
            "arctic", "armchair", "around", "arrange", "arrest", "arrive", "artist",
            "asleep", "aspect", "attack", "attend", "autumn", "avenue", "awkward",
            "backpack", "balance", "balcony", "balloon", "bamboo", "banana", "bandage",
            "bandit", "banker", "banquet", "bargain", "barrel", "basket", "battery",
            "beacon", "beaver", "beetle", "behave", "belief", "belong", "beside",
            "better", "bicycle", "blanket", "blossom", "bottle", "bounce", "bracelet",
            "branch", "breeze", "bridge", "bright", "bronze", "brother", "budget",
            "buffalo", "builder", "bundle", "burden", "butter", "button", "cabbage",
            "cactus", "camera", "campus", "candle", "canyon", "captain", "carbon",
            "carpet", "carrot", "cartoon", "cashier", "castle", "cattle", "caution",
            "ceiling", "cement", "central", "century", "cereal", "certain", "chamber",
            "channel", "chapter", "charity", "cheetah", "cherry", "chicken", "chimney",
            "circle", "circus", "citizen", "classic", "climate", "closet", "clover",
            "cobweb", "coconut", "coffee", "collar", "collect", "colony", "column",
            "comedy", "comfort", "common", "company", "compass", "concert", "cookie",
            "copper", "corner", "costume", "cotton", "country", "courage", "cousin",
            "cracker", "crayon", "cricket", "crystal", "cushion", "custom", "damage",
            "dancer", "danger", "dealer", "debate", "decide", "degree", "desert",
            "design", "detail", "diamond", "dinner", "direct", "discover", "distant",
            "divide", "doctor", "dolphin", "donkey", "double", "dragon", "drawer",
            "driver", "during", "dustpan", "editor", "effect", "effort", "either",
            "eleven", "emerald", "emotion", "empire", "energy", "engine", "enough",
            "entire", "escape", "estate", "evening", "example", "excuse", "expert",
            "fabric", "falcon", "family", "famous", "farmer", "father", "feather",
            "fellow", "female", "figure", "filter", "finger", "finish", "fitness",
            "flavor", "flight", "flower", "follow", "forest", "forget", "formal",
            "fortune", "fossil", "freeze", "friend", "frozen", "future", "galaxy",
            "garden", "garlic", "gather", "gentle", "giraffe", "golden", "gossip",
            "govern", "gravel", "guitar", "hammer", "hamster", "harbor", "harvest",
            "hazard", "health", "heaven", "helmet", "hidden", "hiking", "hockey",
            "honest", "horizon", "humble", "hunger", "hunter", "hurdle", "iceberg",
            "iguana", "impact", "income", "indeed", "indoor", "insect", "inside",
            "invite", "island", "jacket", "jaguar", "jigsaw", "jockey", "journey",
            "jungle", "keeper", "kernel", "kettle", "kitten", "ladder", "lagoon",
            "lantern", "laptop", "lawyer", "leader", "legend", "lesson", "letter",
            "library", "liquid", "listen", "little", "lizard", "lobster", "lonely",
            "magnet", "manner", "marble", "market", "master", "meadow", "measure",
            "melody", "memory", "message", "method", "middle", "mirror", "mitten",
            "modern", "moment", "monkey", "monster", "morning", "motion", "mountain",
            "muffin", "muscle", "museum", "myself", "napkin", "narrow", "nation",
            "native", "nature", "nearly", "needle", "nephew", "noodle", "normal",
            "notice", "number", "object", "office", "orange", "orchid", "origin",
            "otters", "oxygen", "oyster", "palace", "pancake", "parcel", "parent",
            "parrot", "pastry", "peanut", "pencil", "penguin", "people", "pepper",
            "person", "pillow", "pirate", "planet", "pocket", "poetry", "police",
            "polish", "popcorn", "potato", "powder", "prince", "prison", "profit",
            "promise", "public", "puzzle", "python", "rabbit", "raccoon", "racket",
            "radish", "random", "reason", "record", "ribbon", "ripple", "robber",
            "rocket", "rubber", "runner", "saddle", "sailor", "salmon", "sample",
            "sandal", "school", "season", "secret", "shadow", "shovel", "shower",
            "signal", "silver", "simple", "sister", "sketch", "sleeve", "slowly",
            "soccer", "socket", "spider", "spirit", "splash", "sponge", "spring",
            "square", "stable", "stairs", "statue", "steady", "stream", "street",
            "stripe", "strong", "subway", "summer", "sunset", "sweater", "symbol",
            "tablet", "talent", "target", "temple", "tennis", "theory", "thirty",
            "thread", "ticket", "timber", "tissue", "tongue", "travel", "treaty",
            "tunnel", "turkey", "turtle", "twelve", "twenty", "umbrella", "unique",
            "update", "useful", "valley", "velvet", "vessel", "violet", "violin",
            "vision", "visitor", "voyage", "walnut", "wander", "wealth", "weapon",
            "weekly", "weight", "window", "winter", "wisdom", "wizard", "wonder",
            "wooden", "yellow", "yogurt", "zipper", "zombie",
        ],
        "max_attempts": 7,
    },
    "hard": {
        "words": [
            "abbreviation", "abdominal", "absorption", "abundance", "accelerator",
            "acceptance", "accessory", "accidental", "accordion", "accumulation",
            "achievement", "acknowledge", "acquaintance", "acquisition", "adaptation",
            "additional", "admiration", "adolescent", "advantage", "adventure",
            "adversary", "advertisement", "aerodynamic", "affection", "aggregate",
            "agriculture", "algorithm", "allegiance", "alligator", "allocation",
            "allowance", "alternative", "ambassador", "ambiguity", "ambitious",
            "ammunition", "amphibian", "amusement", "analytical", "anatomist",
            "anniversary", "announcement", "anonymous", "antagonist", "antibiotic",
            "anticipate", "antiquity", "apartment", "apologize", "apparatus",
            "apparently", "appearance", "application", "appointment", "appreciate",
            "apprentice", "architect", "arithmetic", "arrangement", "artificial",
            "asparagus", "aspiration", "assessment", "assistance", "associate",
            "assumption", "asynchronous", "atmosphere", "attachment", "attention",
            "attraction", "attribute", "authentic", "authority", "automatic",
            "avalanche", "background", "badminton", "ballerina", "barricade",
            "basketball", "beautiful", "beginning", "beneficial", "bewilderment",
            "binoculars", "biography", "blacksmith", "blueberry", "boomerang",
            "botanical", "boulevard", "breakfast", "brilliant", "broadcast",
            "bureaucracy", "butterfly", "calculate", "camouflage", "candidate",
            "capability", "carpenter", "cartilage", "casserole", "catastrophe",
            "cauliflower", "celebration", "celestial", "centipede", "challenge",
            "chameleon", "champagne", "chandelier", "character", "chemistry",
            "chocolate", "chromosome", "chronicle", "chrysalis", "circumference",
            "civilization", "clarification", "classroom", "claustrophobia", "clockwise",
            "coastline", "coincidence", "collaborate", "collection", "columnist",
            "combination", "comfortable", "commercial", "committee", "community",
            "companion", "comparison", "compassion", "competition", "complicated",
            "composition", "compromise", "concentration", "conclusion", "confidence",
            "consequence", "conservation", "considerate", "constellation",
            "construction", "contagious", "contemporary", "contradiction",
            "contribution", "convenient", "conversation", "cooperation", "coordinate",
            "coriander", "cornucopia", "corporation", "courageous", "cranberry",
            "crocodile", "curiosity", "curriculum", "dandelion", "dangerous",
            "dedication", "deficiency", "democracy", "demonstrate", "description",
            "destination", "determination", "diagnosis", "dictionary", "difference",
            "difficult", "digestion", "dimension", "direction", "disappear",
            "discipline", "discovery", "discussion", "dishwasher", "distinction",
            "distraction", "diversity", "dragonfly", "earthquake", "eccentric",
            "ecologist", "efficient", "elaborate", "electrical", "electricity",
            "elevation", "eliminate", "embroidery", "emergency", "emotional",
            "emphasize", "encyclopedia", "endurance", "enterprise", "enthusiasm",
            "environment", "equilibrium", "equipment", "equivalent", "essential",
            "eucalyptus", "evaluation", "exaggerate", "excellent", "exception",
            "excitement", "exclamation", "exhibition", "existence", "expansion",
            "expedition", "experience", "experiment", "explanation", "extraordinary",
            "extravagant", "fabrication", "fantastic", "fascinating", "fellowship",
            "fireworks", "flashlight", "flexibility", "fluorescent", "formidable",
            "foundation", "frequency", "frustration", "furniture", "galloping",
            "generosity", "geography", "geometric", "gingerbread", "gladiator",
            "glamorous", "grasshopper", "gratitude", "greenhouse", "gymnasium",
            "hamburger", "happiness", "hazardous", "helicopter", "hemisphere",
            "hesitation", "hierarchy", "hippopotamus", "historical", "homecoming",
            "honeycomb", "hospitality", "hurricane", "identical", "illuminate",
            "illustration", "imagination", "immediate", "impatient", "impeccable",
            "important", "impossible", "impression", "improvement", "independent",
            "indicator", "inevitable", "influence", "ingredient", "initiative",
            "innovative", "inquisitive", "inspection", "inspiration", "instruction",
            "instrument", "integrity", "intelligence", "interaction", "interference",
            "international", "interpretation", "interrupt", "invisible", "irrigation",
            "jellyfish", "journalist", "jurisdiction", "kaleidoscope", "kilometer",
            "labyrinth", "landscape", "legitimate", "librarian", "lightning",
            "limestone", "literature", "locomotive", "luxurious", "machinery",
            "magnificent", "maintenance", "manuscript", "marshmallow", "masquerade",
            "mathematics", "mechanical", "melancholy", "memorandum", "merchandise",
            "messenger", "metabolism", "meteorite", "microscope", "migration",
            "miniature", "mischievous", "misunderstanding", "mysterious", "narrative",
            "necessary", "negotiate", "newspaper", "nightingale", "nocturnal",
            "nostalgia", "nutrition", "observatory", "occasional", "occupation",
            "octagonal", "opportunity", "orchestra", "organization", "outrageous",
            "outstanding", "overgrown", "parachute", "paragraph", "parliament",
            "particular", "passenger", "pedestrian", "peninsula", "peppermint",
            "perception", "permanent", "perseverance", "personality", "perspective",
            "phenomenon", "philosophy", "photograph", "photosynthesis", "physician",
            "picturesque", "pineapple", "playground", "plentiful", "pomegranate",
            "population", "porcupine", "possession", "potential", "practical",
            "precaution", "precipitation", "prediction", "preference", "preliminary",
            "preparation", "presentation", "preservation", "principal", "privilege",
            "probability", "procedure", "proclamation", "production", "professional",
            "professor", "pronunciation", "propeller", "proportion", "prosperity",
            "protection", "psychology", "punctuation", "qualification", "quarantine",
            "questionnaire", "quicksilver", "radiation", "reasonable", "recognition",
            "recommendation", "recreation", "rectangular", "reflection", "refrigerator",
            "rehearsal", "remarkable", "remembrance", "repetition", "replacement",
            "representation", "requirement", "resemblance", "reservation", "resilience",
            "resolution", "responsibility", "restaurant", "rhinoceros", "ridiculous",
            "sanctuary", "satellite", "satisfaction", "saxophone", "scholarship",
            "scientific", "screwdriver", "sculpture", "secretary", "semaphore",
            "sensitive", "separation", "silhouette", "sincerely", "skateboard",
            "skyscraper", "snowflake", "sociologist", "sophisticated", "spaghetti",
            "spectacular", "speculation", "spontaneous", "stalactite", "stalagmite",
            "stationary", "stationery", "stegosaurus", "strawberry", "structure",
            "submarine", "substitute", "sufficient", "sunflower", "susceptible",
            "suspension", "suspicious", "symmetrical", "synchronize", "tambourine",
            "tarantula", "technical", "technology", "telescope", "temperature",
            "temporary", "territory", "thermometer", "thoughtful", "threshold",
            "thunderstorm", "traditional", "trampoline", "transparent", "tremendous",
            "troublesome", "turquoise", "typewriter", "unanimous", "unbelievable",
            "uncertainty", "underground", "understanding", "unexpected", "unfortunate",
            "universal", "university", "unnecessary", "upholstery", "vaccination",
            "vegetable", "vegetarian", "vengeance", "versatile", "vibration",
            "victorious", "vocabulary", "voluntary", "watermelon", "wilderness",
            "woodpecker", "worthwhile", "wristwatch", "xylophone", "yesterday",
            "zoological",
        ],
        "max_attempts": 5,
    },
}


def hangman_picture(mistakes, max_attempts):
    """Spread the six drawing stages across the difficulty's mistake limit."""
    stage = min(mistakes * (len(HANGMAN_PICS) - 1) // max_attempts, len(HANGMAN_PICS) - 1)
    return HANGMAN_PICS[stage]



class HangmanGame:
    def __init__(self, word, max_attempts):
        word = word.strip().lower()
        if not word or any(letter not in string.ascii_lowercase for letter in word):
            raise ValueError("The word must contain only English letters.")
        if type(max_attempts) is not int or max_attempts < 1:
            raise ValueError("max_attempts must be a positive integer.")
        self.word = word
        self.max_attempts = max_attempts
        self.guessed = set()
        self.mistakes = 0

    @property
    def won(self):
        return set(self.word) <= self.guessed

    @property
    def over(self):
        return self.won or self.mistakes >= self.max_attempts

    @property
    def score(self):
        return self.max_attempts - self.mistakes if self.won else 0

    def guess(self, letter):
        letter = letter.strip().lower()
        if self.over:
            return "over"
        if len(letter) != 1 or letter not in string.ascii_lowercase:
            return "invalid"
        if letter in self.guessed:
            return "repeated"
        self.guessed.add(letter)
        if letter in self.word:
            return "correct"
        self.mistakes += 1
        return "wrong"
