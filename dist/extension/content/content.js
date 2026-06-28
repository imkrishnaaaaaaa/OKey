(() => {
  // src/core/constants.js
  var APP = Object.freeze({
    NAME: "OKey",
    VERSION: "1.0.0",
    APPSCRIPT_VERSION: "1.0.0",
    SCHEMA_VERSION: "1.0.0",
    /** Bumped when the at-rest vault container format changes. */
    VAULT_FORMAT_VERSION: 2,
    /** Bumped when an individual entry's schema changes. */
    ENTRY_SCHEMA_VERSION: 1,
    MAX_ENTRIES: 1e4,
    MAX_SHEETS: 3
  });
  var KDF = Object.freeze({
    ARGON2_TIME: 3,
    // iterations (t)
    ARGON2_MEMORY_KIB: 65536,
    // 64 MiB (m)
    ARGON2_PARALLELISM: 1,
    // single lane — deterministic across platforms
    ARGON2_HASH_LENGTH: 32,
    // 256-bit output
    PBKDF2_ITERATIONS: 6e5,
    // OWASP 2024 for PBKDF2-HMAC-SHA256
    PBKDF2_HASH: "SHA-256",
    SALT_LENGTH: 32
  });
  var CRYPTO = Object.freeze({
    ALGORITHM: "AES-GCM",
    KEY_LENGTH: 256,
    IV_LENGTH: 12,
    // 96-bit nonce (GCM recommended)
    TAG_LENGTH: 128,
    // 128-bit auth tag (bits)
    SALT_LENGTH: 32
  });
  var SECURITY = Object.freeze({
    DEFAULT_AUTO_LOCK_SECONDS: 60,
    MIN_AUTO_LOCK_SECONDS: 30,
    MAX_AUTO_LOCK_SECONDS: 1800,
    /** Re-open popup within this window → restore unlocked session without re-typing. */
    SESSION_REUNLOCK_COOLDOWN_MINUTES: 1,
    DEFAULT_CLIPBOARD_CLEAR_SECONDS: 30,
    MIN_CLIPBOARD_CLEAR_SECONDS: 10,
    MAX_CLIPBOARD_CLEAR_SECONDS: 120,
    IDLE_DETECTION_INTERVAL: 15,
    MIN_MASTER_PASSWORD_LENGTH: 4,
    // 4-digit PIN
    MAX_FAILED_UNLOCKS: 30,
    WARN_FAILED_UNLOCKS: 25
  });
  var SYNC = Object.freeze({
    DEFAULT_INTERVAL_MINUTES: 1440,
    // 24h
    MIN_INTERVAL_MINUTES: 15,
    MAX_INTERVAL_MINUTES: 10080,
    // 7 days (must be ≥ DEFAULT; previously 60 — bug)
    DEBOUNCE_MS: 1e4,
    MAX_RETRIES: 10,
    INITIAL_BACKOFF_MS: 1e3,
    MAX_BACKOFF_MS: 3e5,
    TOMBSTONE_RETENTION_DAYS: 30,
    ALARM_NAME: "okey-sync",
    AUTO_LOCK_ALARM: "okey-auto-lock",
    CLIPBOARD_ALARM: "okey-clipboard-clear"
  });
  var TOTP = Object.freeze({
    DEFAULT_PERIOD: 30,
    DEFAULT_DIGITS: 6,
    DEFAULT_ALGORITHM: "SHA-1",
    /** Accept codes ±1 step to tolerate clock skew when validating. */
    VALIDATION_WINDOW: 1
  });
  var PASSWORD_GEN = Object.freeze({
    DEFAULT_LENGTH: 20,
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    DEFAULT_UPPERCASE: true,
    DEFAULT_LOWERCASE: true,
    DEFAULT_NUMBERS: true,
    DEFAULT_SYMBOLS: true,
    SYMBOL_SET: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    PASSPHRASE_DEFAULT_WORDS: 5,
    PASSPHRASE_SEPARATOR: "-"
  });
  var FAVICON = Object.freeze({
    ENABLED: true,
    SIZE: 32,
    REFRESH_AFTER_MS: 7 * 24 * 60 * 60 * 1e3,
    // 7 days
    PROVIDER: "https://www.google.com/s2/favicons"
  });
  var DEFAULT_SETTINGS = Object.freeze({
    autoLockTimeout: SECURITY.DEFAULT_AUTO_LOCK_SECONDS,
    miniAutoLockTimeout: 300,
    sessionReunlockCooldown: SECURITY.SESSION_REUNLOCK_COOLDOWN_MINUTES,
    clipboardClearTimeout: SECURITY.DEFAULT_CLIPBOARD_CLEAR_SECONDS,
    biometricEnabled: false,
    autoSyncEnabled: true,
    syncIntervalMinutes: SYNC.DEFAULT_INTERVAL_MINUTES,
    showRecents: true,
    recentsMaxCount: 10,
    faviconsEnabled: true,
    autoSubmitEnabled: false,
    autoFillSingleMatch: false,
    theme: "system",
    passwordGeneratorDefaults: {
      length: PASSWORD_GEN.DEFAULT_LENGTH,
      uppercase: PASSWORD_GEN.DEFAULT_UPPERCASE,
      lowercase: PASSWORD_GEN.DEFAULT_LOWERCASE,
      numbers: PASSWORD_GEN.DEFAULT_NUMBERS,
      symbols: PASSWORD_GEN.DEFAULT_SYMBOLS
    }
  });
  var STORAGE_KEYS = Object.freeze({
    VAULT_DATA: "okey_vault",
    VAULT_SALT: "okey_salt",
    KDF_PARAMS: "okey_kdf_params",
    WRAPPED_BY_MASTER: "okey_wrapped_master",
    WRAPPED_BY_RECOVERY: "okey_wrapped_recovery",
    VAULT_METADATA: "okey_metadata",
    SETTINGS: "okey_settings",
    SHEETS_CONFIG: "okey_sheets",
    OFFLINE_QUEUE: "okey_offline_queue",
    LAST_SYNC_AT: "okey_last_sync",
    RECENTS: "okey_recents",
    THEME: "okey_theme",
    SETUP_COMPLETE: "okey_setup_complete",
    FAVICON_CACHE: "okey_favicon_cache",
    BIOMETRIC_CRED_ID: "okey_biometric_cred_id",
    BIOMETRIC_WRAPPED: "okey_biometric_wrapped",
    SCHEMA_MIGRATED: "okey_schema_migrated",
    CACHED_FOLDERS: "okey_cached_folders",
    FOLDERS_CACHE_TIME: "okey_folders_cache_time",
    FAILED_UNLOCK_ATTEMPTS: "okey_failed_unlocks",
    BACKEND_VERSION_MISMATCH: "okey_backend_version_mismatch",
    BACKEND_CAPABILITIES: "okey_backend_capabilities",
    BACKEND_DASHBOARD: "okey_backend_dashboard",
    BACKEND_ANALYTICS: "okey_backend_analytics",
    ANALYTICS_CACHE_TIME: "okey_analytics_cache_time"
  });
  var LEGACY_STORAGE_KEYS = Object.freeze({
    vaultsheet_vault: STORAGE_KEYS.VAULT_DATA,
    vaultsheet_salt: STORAGE_KEYS.VAULT_SALT,
    vaultsheet_kdf_params: STORAGE_KEYS.KDF_PARAMS,
    vaultsheet_metadata: STORAGE_KEYS.VAULT_METADATA,
    vaultsheet_settings: STORAGE_KEYS.SETTINGS,
    vaultsheet_sheets: STORAGE_KEYS.SHEETS_CONFIG,
    vaultsheet_offline_queue: STORAGE_KEYS.OFFLINE_QUEUE,
    vaultsheet_last_sync: STORAGE_KEYS.LAST_SYNC_AT,
    vaultsheet_recents: STORAGE_KEYS.RECENTS,
    vaultsheet_theme: STORAGE_KEYS.THEME,
    vaultsheet_setup_complete: STORAGE_KEYS.SETUP_COMPLETE
  });
  var ENTRY_TYPES = Object.freeze({
    PASSWORD: "password",
    TOTP: "totp"
  });
  var SHEET_NAMES = Object.freeze({
    VAULT: "OKeyVault",
    META: "OKeyMeta",
    SETTINGS: "OKeySettings",
    ORDER: "OKeyOrder",
    CONFLICTS: "OKeyConflicts"
  });

  // src/core/encoding.js
  var B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var B64_LOOKUP = (() => {
    const t = new Int16Array(256).fill(-1);
    for (let i = 0; i < B64_CHARS.length; i++) t[B64_CHARS.charCodeAt(i)] = i;
    t["=".charCodeAt(0)] = -2;
    return t;
  })();

  // src/core/errors.js
  var OKeyError = class extends Error {
    /** @param {string} message @param {string} code */
    constructor(message, code = "OKEY_ERROR") {
      super(message);
      this.name = "OKeyError";
      this.code = code;
    }
  };
  var ValidationError = class extends OKeyError {
    constructor(message = "Validation failed") {
      super(message, "VALIDATION_ERROR");
      this.name = "ValidationError";
    }
  };

  // src/core/crypto.js
  function randomBytes(n) {
    return globalThis.crypto.getRandomValues(new Uint8Array(n));
  }

  // node_modules/@scure/bip39/esm/wordlists/english.js
  var wordlist = `abandon
ability
able
about
above
absent
absorb
abstract
absurd
abuse
access
accident
account
accuse
achieve
acid
acoustic
acquire
across
act
action
actor
actress
actual
adapt
add
addict
address
adjust
admit
adult
advance
advice
aerobic
affair
afford
afraid
again
age
agent
agree
ahead
aim
air
airport
aisle
alarm
album
alcohol
alert
alien
all
alley
allow
almost
alone
alpha
already
also
alter
always
amateur
amazing
among
amount
amused
analyst
anchor
ancient
anger
angle
angry
animal
ankle
announce
annual
another
answer
antenna
antique
anxiety
any
apart
apology
appear
apple
approve
april
arch
arctic
area
arena
argue
arm
armed
armor
army
around
arrange
arrest
arrive
arrow
art
artefact
artist
artwork
ask
aspect
assault
asset
assist
assume
asthma
athlete
atom
attack
attend
attitude
attract
auction
audit
august
aunt
author
auto
autumn
average
avocado
avoid
awake
aware
away
awesome
awful
awkward
axis
baby
bachelor
bacon
badge
bag
balance
balcony
ball
bamboo
banana
banner
bar
barely
bargain
barrel
base
basic
basket
battle
beach
bean
beauty
because
become
beef
before
begin
behave
behind
believe
below
belt
bench
benefit
best
betray
better
between
beyond
bicycle
bid
bike
bind
biology
bird
birth
bitter
black
blade
blame
blanket
blast
bleak
bless
blind
blood
blossom
blouse
blue
blur
blush
board
boat
body
boil
bomb
bone
bonus
book
boost
border
boring
borrow
boss
bottom
bounce
box
boy
bracket
brain
brand
brass
brave
bread
breeze
brick
bridge
brief
bright
bring
brisk
broccoli
broken
bronze
broom
brother
brown
brush
bubble
buddy
budget
buffalo
build
bulb
bulk
bullet
bundle
bunker
burden
burger
burst
bus
business
busy
butter
buyer
buzz
cabbage
cabin
cable
cactus
cage
cake
call
calm
camera
camp
can
canal
cancel
candy
cannon
canoe
canvas
canyon
capable
capital
captain
car
carbon
card
cargo
carpet
carry
cart
case
cash
casino
castle
casual
cat
catalog
catch
category
cattle
caught
cause
caution
cave
ceiling
celery
cement
census
century
cereal
certain
chair
chalk
champion
change
chaos
chapter
charge
chase
chat
cheap
check
cheese
chef
cherry
chest
chicken
chief
child
chimney
choice
choose
chronic
chuckle
chunk
churn
cigar
cinnamon
circle
citizen
city
civil
claim
clap
clarify
claw
clay
clean
clerk
clever
click
client
cliff
climb
clinic
clip
clock
clog
close
cloth
cloud
clown
club
clump
cluster
clutch
coach
coast
coconut
code
coffee
coil
coin
collect
color
column
combine
come
comfort
comic
common
company
concert
conduct
confirm
congress
connect
consider
control
convince
cook
cool
copper
copy
coral
core
corn
correct
cost
cotton
couch
country
couple
course
cousin
cover
coyote
crack
cradle
craft
cram
crane
crash
crater
crawl
crazy
cream
credit
creek
crew
cricket
crime
crisp
critic
crop
cross
crouch
crowd
crucial
cruel
cruise
crumble
crunch
crush
cry
crystal
cube
culture
cup
cupboard
curious
current
curtain
curve
cushion
custom
cute
cycle
dad
damage
damp
dance
danger
daring
dash
daughter
dawn
day
deal
debate
debris
decade
december
decide
decline
decorate
decrease
deer
defense
define
defy
degree
delay
deliver
demand
demise
denial
dentist
deny
depart
depend
deposit
depth
deputy
derive
describe
desert
design
desk
despair
destroy
detail
detect
develop
device
devote
diagram
dial
diamond
diary
dice
diesel
diet
differ
digital
dignity
dilemma
dinner
dinosaur
direct
dirt
disagree
discover
disease
dish
dismiss
disorder
display
distance
divert
divide
divorce
dizzy
doctor
document
dog
doll
dolphin
domain
donate
donkey
donor
door
dose
double
dove
draft
dragon
drama
drastic
draw
dream
dress
drift
drill
drink
drip
drive
drop
drum
dry
duck
dumb
dune
during
dust
dutch
duty
dwarf
dynamic
eager
eagle
early
earn
earth
easily
east
easy
echo
ecology
economy
edge
edit
educate
effort
egg
eight
either
elbow
elder
electric
elegant
element
elephant
elevator
elite
else
embark
embody
embrace
emerge
emotion
employ
empower
empty
enable
enact
end
endless
endorse
enemy
energy
enforce
engage
engine
enhance
enjoy
enlist
enough
enrich
enroll
ensure
enter
entire
entry
envelope
episode
equal
equip
era
erase
erode
erosion
error
erupt
escape
essay
essence
estate
eternal
ethics
evidence
evil
evoke
evolve
exact
example
excess
exchange
excite
exclude
excuse
execute
exercise
exhaust
exhibit
exile
exist
exit
exotic
expand
expect
expire
explain
expose
express
extend
extra
eye
eyebrow
fabric
face
faculty
fade
faint
faith
fall
false
fame
family
famous
fan
fancy
fantasy
farm
fashion
fat
fatal
father
fatigue
fault
favorite
feature
february
federal
fee
feed
feel
female
fence
festival
fetch
fever
few
fiber
fiction
field
figure
file
film
filter
final
find
fine
finger
finish
fire
firm
first
fiscal
fish
fit
fitness
fix
flag
flame
flash
flat
flavor
flee
flight
flip
float
flock
floor
flower
fluid
flush
fly
foam
focus
fog
foil
fold
follow
food
foot
force
forest
forget
fork
fortune
forum
forward
fossil
foster
found
fox
fragile
frame
frequent
fresh
friend
fringe
frog
front
frost
frown
frozen
fruit
fuel
fun
funny
furnace
fury
future
gadget
gain
galaxy
gallery
game
gap
garage
garbage
garden
garlic
garment
gas
gasp
gate
gather
gauge
gaze
general
genius
genre
gentle
genuine
gesture
ghost
giant
gift
giggle
ginger
giraffe
girl
give
glad
glance
glare
glass
glide
glimpse
globe
gloom
glory
glove
glow
glue
goat
goddess
gold
good
goose
gorilla
gospel
gossip
govern
gown
grab
grace
grain
grant
grape
grass
gravity
great
green
grid
grief
grit
grocery
group
grow
grunt
guard
guess
guide
guilt
guitar
gun
gym
habit
hair
half
hammer
hamster
hand
happy
harbor
hard
harsh
harvest
hat
have
hawk
hazard
head
health
heart
heavy
hedgehog
height
hello
helmet
help
hen
hero
hidden
high
hill
hint
hip
hire
history
hobby
hockey
hold
hole
holiday
hollow
home
honey
hood
hope
horn
horror
horse
hospital
host
hotel
hour
hover
hub
huge
human
humble
humor
hundred
hungry
hunt
hurdle
hurry
hurt
husband
hybrid
ice
icon
idea
identify
idle
ignore
ill
illegal
illness
image
imitate
immense
immune
impact
impose
improve
impulse
inch
include
income
increase
index
indicate
indoor
industry
infant
inflict
inform
inhale
inherit
initial
inject
injury
inmate
inner
innocent
input
inquiry
insane
insect
inside
inspire
install
intact
interest
into
invest
invite
involve
iron
island
isolate
issue
item
ivory
jacket
jaguar
jar
jazz
jealous
jeans
jelly
jewel
job
join
joke
journey
joy
judge
juice
jump
jungle
junior
junk
just
kangaroo
keen
keep
ketchup
key
kick
kid
kidney
kind
kingdom
kiss
kit
kitchen
kite
kitten
kiwi
knee
knife
knock
know
lab
label
labor
ladder
lady
lake
lamp
language
laptop
large
later
latin
laugh
laundry
lava
law
lawn
lawsuit
layer
lazy
leader
leaf
learn
leave
lecture
left
leg
legal
legend
leisure
lemon
lend
length
lens
leopard
lesson
letter
level
liar
liberty
library
license
life
lift
light
like
limb
limit
link
lion
liquid
list
little
live
lizard
load
loan
lobster
local
lock
logic
lonely
long
loop
lottery
loud
lounge
love
loyal
lucky
luggage
lumber
lunar
lunch
luxury
lyrics
machine
mad
magic
magnet
maid
mail
main
major
make
mammal
man
manage
mandate
mango
mansion
manual
maple
marble
march
margin
marine
market
marriage
mask
mass
master
match
material
math
matrix
matter
maximum
maze
meadow
mean
measure
meat
mechanic
medal
media
melody
melt
member
memory
mention
menu
mercy
merge
merit
merry
mesh
message
metal
method
middle
midnight
milk
million
mimic
mind
minimum
minor
minute
miracle
mirror
misery
miss
mistake
mix
mixed
mixture
mobile
model
modify
mom
moment
monitor
monkey
monster
month
moon
moral
more
morning
mosquito
mother
motion
motor
mountain
mouse
move
movie
much
muffin
mule
multiply
muscle
museum
mushroom
music
must
mutual
myself
mystery
myth
naive
name
napkin
narrow
nasty
nation
nature
near
neck
need
negative
neglect
neither
nephew
nerve
nest
net
network
neutral
never
news
next
nice
night
noble
noise
nominee
noodle
normal
north
nose
notable
note
nothing
notice
novel
now
nuclear
number
nurse
nut
oak
obey
object
oblige
obscure
observe
obtain
obvious
occur
ocean
october
odor
off
offer
office
often
oil
okay
old
olive
olympic
omit
once
one
onion
online
only
open
opera
opinion
oppose
option
orange
orbit
orchard
order
ordinary
organ
orient
original
orphan
ostrich
other
outdoor
outer
output
outside
oval
oven
over
own
owner
oxygen
oyster
ozone
pact
paddle
page
pair
palace
palm
panda
panel
panic
panther
paper
parade
parent
park
parrot
party
pass
patch
path
patient
patrol
pattern
pause
pave
payment
peace
peanut
pear
peasant
pelican
pen
penalty
pencil
people
pepper
perfect
permit
person
pet
phone
photo
phrase
physical
piano
picnic
picture
piece
pig
pigeon
pill
pilot
pink
pioneer
pipe
pistol
pitch
pizza
place
planet
plastic
plate
play
please
pledge
pluck
plug
plunge
poem
poet
point
polar
pole
police
pond
pony
pool
popular
portion
position
possible
post
potato
pottery
poverty
powder
power
practice
praise
predict
prefer
prepare
present
pretty
prevent
price
pride
primary
print
priority
prison
private
prize
problem
process
produce
profit
program
project
promote
proof
property
prosper
protect
proud
provide
public
pudding
pull
pulp
pulse
pumpkin
punch
pupil
puppy
purchase
purity
purpose
purse
push
put
puzzle
pyramid
quality
quantum
quarter
question
quick
quit
quiz
quote
rabbit
raccoon
race
rack
radar
radio
rail
rain
raise
rally
ramp
ranch
random
range
rapid
rare
rate
rather
raven
raw
razor
ready
real
reason
rebel
rebuild
recall
receive
recipe
record
recycle
reduce
reflect
reform
refuse
region
regret
regular
reject
relax
release
relief
rely
remain
remember
remind
remove
render
renew
rent
reopen
repair
repeat
replace
report
require
rescue
resemble
resist
resource
response
result
retire
retreat
return
reunion
reveal
review
reward
rhythm
rib
ribbon
rice
rich
ride
ridge
rifle
right
rigid
ring
riot
ripple
risk
ritual
rival
river
road
roast
robot
robust
rocket
romance
roof
rookie
room
rose
rotate
rough
round
route
royal
rubber
rude
rug
rule
run
runway
rural
sad
saddle
sadness
safe
sail
salad
salmon
salon
salt
salute
same
sample
sand
satisfy
satoshi
sauce
sausage
save
say
scale
scan
scare
scatter
scene
scheme
school
science
scissors
scorpion
scout
scrap
screen
script
scrub
sea
search
season
seat
second
secret
section
security
seed
seek
segment
select
sell
seminar
senior
sense
sentence
series
service
session
settle
setup
seven
shadow
shaft
shallow
share
shed
shell
sheriff
shield
shift
shine
ship
shiver
shock
shoe
shoot
shop
short
shoulder
shove
shrimp
shrug
shuffle
shy
sibling
sick
side
siege
sight
sign
silent
silk
silly
silver
similar
simple
since
sing
siren
sister
situate
six
size
skate
sketch
ski
skill
skin
skirt
skull
slab
slam
sleep
slender
slice
slide
slight
slim
slogan
slot
slow
slush
small
smart
smile
smoke
smooth
snack
snake
snap
sniff
snow
soap
soccer
social
sock
soda
soft
solar
soldier
solid
solution
solve
someone
song
soon
sorry
sort
soul
sound
soup
source
south
space
spare
spatial
spawn
speak
special
speed
spell
spend
sphere
spice
spider
spike
spin
spirit
split
spoil
sponsor
spoon
sport
spot
spray
spread
spring
spy
square
squeeze
squirrel
stable
stadium
staff
stage
stairs
stamp
stand
start
state
stay
steak
steel
stem
step
stereo
stick
still
sting
stock
stomach
stone
stool
story
stove
strategy
street
strike
strong
struggle
student
stuff
stumble
style
subject
submit
subway
success
such
sudden
suffer
sugar
suggest
suit
summer
sun
sunny
sunset
super
supply
supreme
sure
surface
surge
surprise
surround
survey
suspect
sustain
swallow
swamp
swap
swarm
swear
sweet
swift
swim
swing
switch
sword
symbol
symptom
syrup
system
table
tackle
tag
tail
talent
talk
tank
tape
target
task
taste
tattoo
taxi
teach
team
tell
ten
tenant
tennis
tent
term
test
text
thank
that
theme
then
theory
there
they
thing
this
thought
three
thrive
throw
thumb
thunder
ticket
tide
tiger
tilt
timber
time
tiny
tip
tired
tissue
title
toast
tobacco
today
toddler
toe
together
toilet
token
tomato
tomorrow
tone
tongue
tonight
tool
tooth
top
topic
topple
torch
tornado
tortoise
toss
total
tourist
toward
tower
town
toy
track
trade
traffic
tragic
train
transfer
trap
trash
travel
tray
treat
tree
trend
trial
tribe
trick
trigger
trim
trip
trophy
trouble
truck
true
truly
trumpet
trust
truth
try
tube
tuition
tumble
tuna
tunnel
turkey
turn
turtle
twelve
twenty
twice
twin
twist
two
type
typical
ugly
umbrella
unable
unaware
uncle
uncover
under
undo
unfair
unfold
unhappy
uniform
unique
unit
universe
unknown
unlock
until
unusual
unveil
update
upgrade
uphold
upon
upper
upset
urban
urge
usage
use
used
useful
useless
usual
utility
vacant
vacuum
vague
valid
valley
valve
van
vanish
vapor
various
vast
vault
vehicle
velvet
vendor
venture
venue
verb
verify
version
very
vessel
veteran
viable
vibrant
vicious
victory
video
view
village
vintage
violin
virtual
virus
visa
visit
visual
vital
vivid
vocal
voice
void
volcano
volume
vote
voyage
wage
wagon
wait
walk
wall
walnut
want
warfare
warm
warrior
wash
wasp
waste
water
wave
way
wealth
weapon
wear
weasel
weather
web
wedding
weekend
weird
welcome
west
wet
whale
what
wheat
wheel
when
where
whip
whisper
wide
width
wife
wild
will
win
window
wine
wing
wink
winner
winter
wire
wisdom
wise
wish
witness
wolf
woman
wonder
wood
wool
word
work
world
worry
worth
wrap
wreck
wrestle
wrist
write
wrong
yard
year
yellow
you
young
youth
zebra
zero
zone
zoo`.split("\n");

  // src/core/password-generator.js
  var LOWER = "abcdefghijklmnopqrstuvwxyz";
  var UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var DIGITS = "0123456789";
  function randIntBelow(max) {
    if (max <= 0) throw new RangeError("max must be > 0");
    const limit = Math.floor(256 / max) * max;
    for (; ; ) {
      const b = randomBytes(1)[0];
      if (b < limit) return b % max;
    }
  }
  function pick(charset) {
    return charset[randIntBelow(charset.length)];
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randIntBelow(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function generatePassword(options = {}) {
    const length = Math.min(Math.max(options.length ?? PASSWORD_GEN.DEFAULT_LENGTH, 1), PASSWORD_GEN.MAX_LENGTH);
    const uppercase = options.uppercase ?? PASSWORD_GEN.DEFAULT_UPPERCASE;
    const lowercase = options.lowercase ?? PASSWORD_GEN.DEFAULT_LOWERCASE;
    const numbers = options.numbers ?? PASSWORD_GEN.DEFAULT_NUMBERS;
    const symbols = options.symbols ?? PASSWORD_GEN.DEFAULT_SYMBOLS;
    const symbolSet = options.symbolSet || PASSWORD_GEN.SYMBOL_SET;
    const classes = [];
    if (lowercase) classes.push(LOWER);
    if (uppercase) classes.push(UPPER);
    if (numbers) classes.push(DIGITS);
    if (symbols) classes.push(symbolSet);
    if (classes.length === 0) classes.push(LOWER + UPPER + DIGITS);
    const charset = classes.join("");
    const chars = [];
    for (let i = 0; i < classes.length && i < length; i++) chars.push(pick(classes[i]));
    for (let i = chars.length; i < length; i++) chars.push(pick(charset));
    return shuffle(chars).join("");
  }

  // src/core/totp.js
  var BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  function base32Decode(base32) {
    const cleaned = String(base32 || "").replace(/[\s=]/g, "").toUpperCase();
    let bits = 0;
    let value = 0;
    const out = [];
    for (const ch of cleaned) {
      const idx = BASE32_ALPHABET.indexOf(ch);
      if (idx === -1) throw new ValidationError("Invalid Base32 character in TOTP secret");
      value = value << 5 | idx;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        out.push(value >>> bits & 255);
      }
    }
    return new Uint8Array(out);
  }
  var HMAC_HASH = { "SHA-1": "SHA-1", SHA1: "SHA-1", "SHA-256": "SHA-256", SHA256: "SHA-256", "SHA-512": "SHA-512", SHA512: "SHA-512" };
  async function hmac(keyBytes, msgBytes, algorithm) {
    const hash = HMAC_HASH[algorithm] || "SHA-1";
    const key = await globalThis.crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash }, false, ["sign"]);
    return new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, msgBytes));
  }
  function counterBytes(counter) {
    const buf = new Uint8Array(8);
    let n = counter;
    for (let i = 7; i >= 0; i--) {
      buf[i] = n & 255;
      n = Math.floor(n / 256);
    }
    return buf;
  }
  async function hotp(keyBytes, counter, digits = TOTP.DEFAULT_DIGITS, algorithm = TOTP.DEFAULT_ALGORITHM) {
    const hash = await hmac(keyBytes, counterBytes(counter), algorithm);
    const offset = hash[hash.length - 1] & 15;
    const bin = (hash[offset] & 127) << 24 | (hash[offset + 1] & 255) << 16 | (hash[offset + 2] & 255) << 8 | hash[offset + 3] & 255;
    return (bin % 10 ** digits).toString().padStart(digits, "0");
  }
  async function generateTOTP(secret, opts = {}) {
    const period = opts.period ?? TOTP.DEFAULT_PERIOD;
    const digits = opts.digits ?? TOTP.DEFAULT_DIGITS;
    const algorithm = opts.algorithm ?? TOTP.DEFAULT_ALGORITHM;
    const ts = opts.timestamp ?? Date.now();
    const seconds = Math.floor(ts / 1e3);
    const counter = Math.floor(seconds / period);
    const remaining = period - seconds % period;
    const code = await hotp(base32Decode(secret), counter, digits, algorithm);
    return { code, remaining, period };
  }
  function isValidTotpSecret(secret) {
    if (!secret || typeof secret !== "string") return false;
    const cleaned = secret.replace(/[\s=]/g, "").toUpperCase();
    return /^[A-Z2-7]+$/.test(cleaned) && cleaned.length >= 16;
  }

  // src/extension/lib/messages.js
  var MSG = Object.freeze({
    // Vault lifecycle (status is derived from session presence)
    VAULT_LOCKED: "VAULT_LOCKED",
    LOCK_VAULT: "LOCK_VAULT",
    UNLOCK_VAULT: "UNLOCK_VAULT",
    // Settings
    GET_SETTINGS: "GET_SETTINGS",
    UPDATE_SETTINGS: "UPDATE_SETTINGS",
    // Clipboard
    COPY_TO_CLIPBOARD: "COPY_TO_CLIPBOARD",
    // Sync
    TRIGGER_SYNC: "TRIGGER_SYNC",
    RESCHEDULE_SYNC: "RESCHEDULE_SYNC",
    SYNC_COMPLETE: "SYNC_COMPLETE",
    SYNC_ERROR: "SYNC_ERROR",
    // Site detection / autofill
    GET_CURRENT_SITE: "GET_CURRENT_SITE",
    GET_SITE_CREDENTIALS: "GET_SITE_CREDENTIALS",
    FILL_CREDENTIAL: "FILL_CREDENTIAL",
    OPEN_POPUP: "OPEN_POPUP",
    TOUCH_SESSION: "TOUCH_SESSION",
    ADD_CREDENTIAL: "ADD_CREDENTIAL",
    // Autofill session tracking
    SET_ACTIVE_FILLING_SESSION: "SET_ACTIVE_FILLING_SESSION",
    GET_ACTIVE_FILLING_SESSION: "GET_ACTIVE_FILLING_SESSION",
    CLEAR_ACTIVE_FILLING_SESSION: "CLEAR_ACTIVE_FILLING_SESSION"
  });

  // src/extension/content/content.js
  var BADGE = "okey-badge";
  var PANEL = "okey-panel";
  var tracked = /* @__PURE__ */ new WeakMap();
  var repositionRegistry = /* @__PURE__ */ new Set();
  var panelEl = null;
  var settings = { autoSubmitEnabled: false, autoFillSingleMatch: false };
  var activeSessionCred = null;
  var activeSessionTime = 0;
  var singleMatchAttempted = false;
  async function triggerSingleMatchAutofill() {
    if (singleMatchAttempted || activeSessionCred) return;
    const inputs = [...document.querySelectorAll("input")];
    const anchorEl = inputs.find((el) => (isUsernameField(el) || isPasswordField(el)) && el.offsetParent !== null && !el.value);
    if (!anchorEl) return;
    singleMatchAttempted = true;
    const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS, url: location.href }).catch(() => null);
    if (res && !res.locked && res.matches && res.matches.length === 1) {
      const cred = res.matches[0];
      fillAndRememberCredential(anchorEl, cred);
    }
  }
  var SVG_KEY = '<svg viewBox="0 0 24 24" fill="none" width="13" height="13"><rect x="3" y="10" width="18" height="11" rx="3.5" stroke="#6d5efc" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#6d5efc" stroke-width="2"/><circle cx="12" cy="15.5" r="1.4" fill="#6d5efc"/></svg>';
  function isPasswordField(el) {
    return el.tagName === "INPUT" && el.type === "password";
  }
  function isUsernameField(el) {
    if (el.tagName !== "INPUT") return false;
    if (!["text", "email", "tel", ""].includes(el.type)) return false;
    const aria = el.getAttribute("aria-label") || "";
    const jsname = el.getAttribute("jsname") || "";
    const hay = `${el.name} ${el.id} ${el.autocomplete} ${el.placeholder} ${aria} ${jsname}`.toLowerCase();
    return /user|email|login|account|phone|mobile|identifier/.test(hay) || el.autocomplete === "username";
  }
  function isTotpField(el) {
    if (el.tagName !== "INPUT") return false;
    if (!["text", "number", "tel"].includes(el.type)) return false;
    const hay = `${el.name} ${el.id} ${el.autocomplete} ${el.placeholder} ${el.className}`.toLowerCase();
    return /totp|2fa|otp|auth|code|verification|factor|secure|pin/.test(hay) || el.autocomplete === "one-time-code";
  }
  function isButtonLike(el) {
    if (el.tagName !== "INPUT") return false;
    if (el.type === "password") return false;
    if (["submit", "button", "image", "reset"].includes(el.type)) return true;
    const val = (el.value || "").trim().toLowerCase();
    if (!val) return false;
    const buttonKeywords = ["login", "log in", "signin", "sign in", "submit", "continue", "next", "proceed", "go", "ok", "verify", "confirm"];
    return buttonKeywords.includes(val) || /log\s*in|sign\s*in|submit|continue|next|proceed|verify|confirm/i.test(val);
  }
  function findSubmitButton(anchorEl) {
    const selectors = [
      'button[jsname="LgbsSe"]',
      "button.VfPpkd-LgbsSe",
      'button[type="submit"]',
      'input[type="submit"]',
      'button[id*="login" i]',
      'button[id*="signin" i]',
      'button[id*="submit" i]',
      'button[id*="next" i]',
      'button[id*="continue" i]',
      'input[type="button"][value*="Login" i]',
      'input[type="button"][value*="Sign" i]',
      'input[type="button"][value*="Next" i]',
      'input[type="button"][value*="Continue" i]',
      "button.btn-primary",
      "button.button-primary",
      "button.submit",
      "button.login"
    ];
    const keywords = [/log\s*in/i, /sign\s*in/i, /next/i, /continue/i, /submit/i, /confirm/i, /verify/i];
    let parent = anchorEl.parentElement;
    for (let i = 0; i < 5 && parent; i++) {
      for (const sel of selectors) {
        const btn = parent.querySelector(sel);
        if (btn) return btn;
      }
      const buttons2 = parent.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
      for (const btn of buttons2) {
        const text = btn.tagName === "INPUT" ? btn.value : btn.textContent;
        if (keywords.some((regex) => regex.test(text))) {
          return btn;
        }
      }
      parent = parent.parentElement;
    }
    const form = anchorEl.form;
    if (form) {
      for (const sel of selectors) {
        const btn = form.querySelector(sel);
        if (btn) return btn;
      }
      const buttons2 = form.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
      for (const btn of buttons2) {
        const text = btn.tagName === "INPUT" ? btn.value : btn.textContent;
        if (keywords.some((regex) => regex.test(text))) {
          return btn;
        }
      }
    }
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) return btn;
    }
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
    for (const btn of buttons) {
      const text = btn.tagName === "INPUT" ? btn.value : btn.textContent;
      if (keywords.some((regex) => regex.test(text))) {
        return btn;
      }
    }
    return null;
  }
  function submitForm(anchorEl) {
    const btn = findSubmitButton(anchorEl);
    if (btn) {
      if (btn.disabled || btn.getAttribute("aria-disabled") === "true") {
        btn.disabled = false;
        btn.removeAttribute("disabled");
        btn.setAttribute("aria-disabled", "false");
      }
      btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
      btn.click();
      return;
    }
    const form = anchorEl.form || document;
    const pwField = isPasswordField(anchorEl) ? anchorEl : form.querySelector("input[type=password]");
    const targetInput = pwField || anchorEl;
    if (targetInput) {
      const opts = { bubbles: true, cancelable: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 };
      targetInput.dispatchEvent(new KeyboardEvent("keydown", opts));
      targetInput.dispatchEvent(new KeyboardEvent("keypress", opts));
      targetInput.dispatchEvent(new KeyboardEvent("keyup", opts));
    }
    if (anchorEl.form) {
      anchorEl.form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      try {
        anchorEl.form.submit();
      } catch (e) {
        console.warn("OKey form.submit() failed:", e);
      }
    }
  }
  function repositionAll() {
    repositionRegistry.forEach((fn) => {
      try {
        fn();
      } catch (e) {
      }
    });
  }
  function attach(el) {
    if (tracked.has(el) || el.dataset.okeyIgnore) return;
    if (isButtonLike(el)) return;
    if (!isPasswordField(el) && !isUsernameField(el) && !isTotpField(el)) return;
    tracked.set(el, null);
    if (isPasswordField(el)) {
      el.setAttribute("autocomplete", "new-password");
    } else {
      el.setAttribute("autocomplete", "off");
    }
    const badge = document.createElement("div");
    badge.className = BADGE;
    badge.innerHTML = SVG_KEY;
    badge.title = "OKey";
    if (document.body) {
      document.body.appendChild(badge);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        try {
          document.body.appendChild(badge);
          reposition();
        } catch (e) {
        }
      });
    }
    const reposition = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 12 || el.offsetParent === null) {
        badge.style.display = "none";
        return;
      }
      const size = r.height < 30 ? 18 : 22;
      badge.style.width = badge.style.height = `${size}px`;
      badge.style.left = `${window.scrollX + r.right - size - 6}px`;
      badge.style.top = `${window.scrollY + r.top + (r.height - size) / 2}px`;
      badge.dataset.mode = isPasswordField(el) && !el.value ? "generate" : "fill";
      const shouldShow = document.activeElement === el || el.value === "" || isUsernameField(el) || isTotpField(el);
      badge.style.display = shouldShow ? "flex" : "none";
      if (settings.autoFillSingleMatch && !singleMatchAttempted && !activeSessionCred) {
        triggerSingleMatchAutofill();
      }
    };
    tracked.set(el, reposition);
    repositionRegistry.add(reposition);
    const show = () => {
      reposition();
    };
    const hideSoon = () => setTimeout(() => {
      if (document.activeElement !== el && !badge.matches(":hover")) badge.style.display = "none";
    }, 150);
    el.addEventListener("focus", show);
    el.addEventListener("blur", hideSoon);
    el.addEventListener("input", reposition);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    const ro = new ResizeObserver(() => {
      reposition();
    });
    ro.observe(el);
    const removalObserver = new MutationObserver(() => {
      if (!document.contains(el)) {
        repositionRegistry.delete(reposition);
        removalObserver.disconnect();
      }
    });
    removalObserver.observe(document, { childList: true, subtree: true });
    badge.addEventListener("mousedown", (e) => e.preventDefault());
    badge.addEventListener("click", async (e) => {
      e.stopPropagation();
      openPanel(el, badge);
    });
    reposition();
    badge.style.display = "none";
    if (activeSessionCred && Date.now() - activeSessionTime < 6e4) {
      if (isPasswordField(el) && !el.value) {
        setValue(el, activeSessionCred.password);
        if (settings.autoSubmitEnabled) {
          setTimeout(() => submitForm(el), 150);
        }
      } else if (isTotpField(el) && !el.value) {
        if (activeSessionCred.totpSecret && isValidTotpSecret(activeSessionCred.totpSecret)) {
          generateTOTP(activeSessionCred.totpSecret).then(({ code }) => {
            if (code) {
              setValue(el, code);
              if (settings.autoSubmitEnabled) {
                setTimeout(() => submitForm(el), 150);
              }
            }
          }).catch(console.error);
        }
      }
    }
  }
  function fillGenerated(passwordEl) {
    const pw = generatePassword({ length: 20 });
    setValue(passwordEl, pw);
    const confirm = [...passwordEl.form?.querySelectorAll("input[type=password]") || []].find((x) => x !== passwordEl);
    if (confirm) setValue(confirm, pw);
    toast("Strong password filled & copied");
    navigator.clipboard?.writeText(pw).catch(() => {
    });
  }
  async function openPanel(anchorEl, badge) {
    closePanel();
    const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS, url: location.href }).catch(() => null);
    if (res && res.settings) {
      settings = { ...settings, ...res.settings };
    }
    panelEl = document.createElement("div");
    panelEl.className = PANEL;
    const resolvedTheme = settings.theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : settings.theme;
    panelEl.setAttribute("data-theme", resolvedTheme || "dark");
    if (!res || res.locked) {
      panelEl.appendChild(header("OKey is locked"));
      const container = document.createElement("div");
      container.className = "okey-panel-lock-container";
      container.style.cssText = "padding: 12px 10px; display: flex; flex-direction: column; gap: 10px;";
      const labelEl = document.createElement("div");
      labelEl.className = "okey-panel-sub";
      labelEl.textContent = "Enter master PIN to unlock";
      labelEl.style.cssText = "text-align: center; margin-bottom: 4px; font-weight: 500;";
      container.appendChild(labelEl);
      const pinInput = document.createElement("input");
      pinInput.type = "password";
      pinInput.placeholder = "Enter PIN";
      pinInput.inputMode = "numeric";
      pinInput.pattern = "[0-9]*";
      pinInput.maxLength = 4;
      pinInput.style.cssText = `
      width: calc(100% - 24px);
      margin-left: 12px;
      padding: 10px 12px;
      background: var(--okey-bg-elev-2, #222);
      border: 1px solid var(--okey-brand, #00e676);
      border-radius: 8px;
      color: var(--okey-text, #fff);
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      letter-spacing: 0.5em;
      text-align: center;
    `;
      container.appendChild(pinInput);
      const errMsg = document.createElement("div");
      errMsg.style.cssText = "font-size: 11px; color: var(--okey-danger, #f95766); display: none; text-align: center; margin-top: 4px;";
      container.appendChild(errMsg);
      panelEl.appendChild(container);
      const doUnlock = async () => {
        const pin = pinInput.value;
        if (pin.length < 4) return;
        pinInput.disabled = true;
        errMsg.style.display = "none";
        const unlockRes = await chrome.runtime.sendMessage({ type: MSG.UNLOCK_VAULT, pin }).catch(() => null);
        if (unlockRes && unlockRes.success) {
          openPanel(anchorEl, badge);
        } else {
          pinInput.disabled = false;
          errMsg.textContent = unlockRes?.error || "Incorrect PIN";
          errMsg.style.display = "block";
          pinInput.value = "";
          pinInput.focus();
        }
      };
      pinInput.addEventListener("input", () => {
        pinInput.value = pinInput.value.replace(/[^0-9]/g, "").slice(0, 4);
        if (pinInput.value.length === 4) {
          doUnlock();
        }
      });
      setTimeout(() => pinInput.focus(), 50);
    } else {
      const searchContainer = document.createElement("div");
      searchContainer.className = "okey-panel-search-container";
      searchContainer.style.cssText = "padding: 6px 10px; border-bottom: 1px solid var(--okey-border, #444); display: flex;";
      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = "Search logins...";
      searchInput.className = "okey-panel-search-input";
      searchInput.style.cssText = "width: 100%; padding: 6px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--okey-border, #444); background: var(--okey-bg-elev-2, #222); color: var(--okey-text, #fff); box-sizing: border-box; outline: none; font-family: inherit; transition: border-color 0.15s ease;";
      searchInput.addEventListener("focus", () => {
        searchInput.style.borderColor = "var(--okey-brand, #00e676)";
      });
      searchInput.addEventListener("blur", () => {
        searchInput.style.borderColor = "var(--okey-border, #444)";
      });
      searchContainer.appendChild(searchInput);
      panelEl.appendChild(searchContainer);
      const listContainer = document.createElement("div");
      listContainer.className = "okey-panel-list";
      listContainer.style.cssText = "max-height: 180px; overflow-y: auto;";
      panelEl.appendChild(listContainer);
      const renderList = (query = "") => {
        listContainer.innerHTML = "";
        const q = query.toLowerCase().trim();
        const matchedFiltered = res.matches.filter((c) => {
          const name = (c.siteName || "").toLowerCase();
          const dom = (c.domain || "").toLowerCase();
          const user = (c.username || "").toLowerCase();
          return name.includes(q) || dom.includes(q) || user.includes(q);
        });
        const othersFiltered = res.others.filter((c) => {
          const name = (c.siteName || "").toLowerCase();
          const dom = (c.domain || "").toLowerCase();
          const user = (c.username || "").toLowerCase();
          return name.includes(q) || dom.includes(q) || user.includes(q);
        });
        if (matchedFiltered.length) {
          listContainer.appendChild(header(`For ${location.hostname.replace(/^www\./, "")}`));
          matchedFiltered.forEach((c) => listContainer.appendChild(credRow(c, anchorEl)));
        } else if (!q) {
          listContainer.appendChild(header("No saved logins for this site"));
        }
        if (othersFiltered.length) {
          listContainer.appendChild(header("Other logins"));
          const displayOthers = q ? othersFiltered : othersFiltered.slice(0, 3);
          displayOthers.forEach((c) => listContainer.appendChild(credRow(c, anchorEl)));
        }
      };
      renderList("");
      searchInput.addEventListener("input", () => renderList(searchInput.value));
      const div = document.createElement("div");
      div.className = "okey-panel-divider";
      panelEl.appendChild(div);
      panelEl.appendChild(row("+ Add new login", "Save credential for this site", () => {
        closePanel();
        openAddModal(anchorEl);
      }));
      if (isPasswordField(anchorEl)) {
        panelEl.appendChild(row("\u26A1 Generate strong password", "Create and copy a secure password", () => {
          closePanel();
          fillGenerated(anchorEl);
        }));
      }
      setTimeout(() => searchInput.focus(), 50);
    }
    const r = badge.getBoundingClientRect();
    panelEl.style.left = `${Math.max(8, window.scrollX + r.right - 280)}px`;
    panelEl.style.top = `${window.scrollY + r.bottom + 6}px`;
    document.body.appendChild(panelEl);
    setTimeout(() => document.addEventListener("click", onDocClick, { once: true }), 0);
  }
  function onDocClick(e) {
    if (panelEl && !panelEl.contains(e.target)) closePanel();
  }
  function closePanel() {
    panelEl?.remove();
    panelEl = null;
  }
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function closeAddModal() {
    const overlay = document.querySelector(".okey-overlay");
    if (overlay) overlay.remove();
  }
  function openAddModal(anchorEl) {
    closeAddModal();
    const overlay = document.createElement("div");
    overlay.className = "okey-overlay";
    const modal = document.createElement("div");
    modal.className = "okey-modal";
    const resolvedTheme = settings.theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : settings.theme;
    modal.setAttribute("data-theme", resolvedTheme || "dark");
    const titleVal = document.title.split("|")[0].split("-")[0].trim() || location.hostname;
    const domainVal = location.hostname.replace(/^www\./, "");
    const usernameVal = "";
    const passwordVal = "";
    modal.innerHTML = `
    <h3 class="okey-modal-title">Add Login to OKey</h3>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Site Name</label>
      <input type="text" class="okey-modal-input" id="okey-add-sitename" value="${escapeHtml(titleVal)}" placeholder="e.g. Google">
    </div>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Domain</label>
      <input type="text" class="okey-modal-input" id="okey-add-domain" value="${escapeHtml(domainVal)}" placeholder="e.g. google.com">
    </div>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Username / Email</label>
      <input type="text" class="okey-modal-input" id="okey-add-username" value="${escapeHtml(usernameVal)}" placeholder="Enter username or email" autocomplete="new-password">
    </div>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Password</label>
      <div class="okey-modal-input-group">
        <input type="text" class="okey-modal-input" id="okey-add-password" value="${escapeHtml(passwordVal)}" placeholder="Password" autocomplete="new-password">
        <button type="button" class="okey-modal-affix-btn" id="okey-add-gen">Generate</button>
      </div>
    </div>

    <div class="okey-modal-field">
      <label class="okey-modal-label">TOTP Secret <span style="font-weight:normal;opacity:0.6;">(optional)</span></label>
      <input type="text" class="okey-modal-input" id="okey-add-totp" placeholder="Base32 secret">
    </div>
    
    <div class="okey-modal-buttons">
      <button type="button" class="okey-modal-btn okey-modal-btn-secondary" id="okey-add-cancel">Cancel</button>
      <button type="button" class="okey-modal-btn okey-modal-btn-primary" id="okey-add-save">Save & Autofill</button>
    </div>
  `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAddModal();
      }
    });
    modal.querySelector("#okey-add-gen").addEventListener("click", () => {
      const pwInput = modal.querySelector("#okey-add-password");
      pwInput.value = generatePassword(settings.passwordGeneratorDefaults || { length: 20 });
    });
    modal.querySelector("#okey-add-cancel").addEventListener("click", () => {
      closeAddModal();
    });
    modal.querySelector("#okey-add-save").addEventListener("click", async () => {
      const siteName = modal.querySelector("#okey-add-sitename").value.trim();
      const domain = modal.querySelector("#okey-add-domain").value.trim();
      const username = modal.querySelector("#okey-add-username").value.trim();
      const password = modal.querySelector("#okey-add-password").value;
      const totpSecret = modal.querySelector("#okey-add-totp").value.replace(/\s+/g, "");
      if (!siteName && !domain) {
        alert("Please provide a Site Name or Domain.");
        return;
      }
      if (totpSecret && !isValidTotpSecret(totpSecret)) {
        alert("Invalid TOTP secret (must be base32).");
        return;
      }
      const data = {
        siteName,
        domain: domain.toLowerCase(),
        username,
        password,
        totpSecret,
        entryType: "password"
      };
      const res = await chrome.runtime.sendMessage({ type: MSG.ADD_CREDENTIAL, data }).catch(() => null);
      if (res && res.success && res.entry) {
        closeAddModal();
        fillAndRememberCredential(anchorEl, res.entry);
        toast("Saved & filled by OKey");
      } else {
        alert(res?.error || "Failed to save credential. Please ensure OKey is unlocked.");
      }
    });
  }
  function header(text) {
    const d = document.createElement("div");
    d.className = "okey-panel-header";
    d.textContent = text;
    return d;
  }
  function row(title, sub, onclick) {
    const d = document.createElement("div");
    d.className = "okey-panel-row";
    d.innerHTML = `<div class="okey-panel-title"></div><div class="okey-panel-sub"></div>`;
    d.querySelector(".okey-panel-title").textContent = title;
    d.querySelector(".okey-panel-sub").textContent = sub || "";
    if (onclick) d.addEventListener("click", onclick);
    return d;
  }
  function fillAndRememberCredential(anchorEl, cred) {
    activeSessionCred = cred;
    activeSessionTime = Date.now();
    chrome.runtime.sendMessage({ type: MSG.SET_ACTIVE_FILLING_SESSION, cred }).catch(() => {
    });
    fillCredential(anchorEl, cred);
    startAutofillPolling();
    if (settings.autoSubmitEnabled) {
      setTimeout(() => submitForm(anchorEl), 150);
    }
  }
  function credRow(cred, anchorEl) {
    const d = row(cred.siteName || cred.domain, cred.username || "(no username)", () => {
      fillAndRememberCredential(anchorEl, cred);
      closePanel();
    });
    return d;
  }
  function fillCredential(anchorEl, cred) {
    const form = anchorEl.form || document;
    const pwField = isPasswordField(anchorEl) ? anchorEl : form.querySelector("input[type=password]");
    const userField = isUsernameField(anchorEl) ? anchorEl : [...form.querySelectorAll("input")].find(isUsernameField);
    if (userField && cred.username) setValue(userField, cred.username);
    if (pwField && cred.password) setValue(pwField, cred.password);
    const totpEl = [...form.querySelectorAll("input")].find(isTotpField);
    if (totpEl && cred.totpSecret && isValidTotpSecret(cred.totpSecret)) {
      generateTOTP(cred.totpSecret).then(({ code }) => {
        if (code) setValue(totpEl, code);
      }).catch(console.error);
    }
    toast("Filled by OKey");
  }
  function setValue(el, value) {
    el.focus();
    try {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      const protoSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
      const setter = nativeSetter || protoSetter;
      if (setter) {
        setter.call(el, value);
      } else {
        el.value = value;
      }
    } catch (e) {
      el.value = value;
    }
    try {
      el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: value, inputType: "insertText" }));
    } catch (e) {
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    const opts = { bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent("keydown", opts));
    el.dispatchEvent(new KeyboardEvent("keypress", opts));
    el.dispatchEvent(new KeyboardEvent("keyup", opts));
    el.blur();
  }
  function toast(text) {
    const t = document.createElement("div");
    t.className = "okey-toast";
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  var autofillPollInterval = null;
  var autofillPollStart = 0;
  function startAutofillPolling() {
    if (autofillPollInterval) clearInterval(autofillPollInterval);
    autofillPollStart = Date.now();
    autofillPollInterval = setInterval(() => {
      if (Date.now() - autofillPollStart > 6e4 || !activeSessionCred) {
        stopAutofillPolling();
        return;
      }
      const inputs = document.querySelectorAll("input");
      for (const el of inputs) {
        if (isButtonLike(el)) continue;
        if (isPasswordField(el) && el.offsetParent !== null && !el.value) {
          setValue(el, activeSessionCred.password);
          toast("Autofilled by OKey");
          if (settings.autoSubmitEnabled) {
            setTimeout(() => submitForm(el), 150);
          }
        } else if (isTotpField(el) && el.offsetParent !== null && !el.value) {
          if (activeSessionCred.totpSecret && isValidTotpSecret(activeSessionCred.totpSecret)) {
            const savedCred = activeSessionCred;
            activeSessionCred = null;
            generateTOTP(savedCred.totpSecret).then(({ code }) => {
              activeSessionCred = savedCred;
              if (code && !el.value) {
                setValue(el, code);
                toast("Autofilled by OKey");
                chrome.runtime.sendMessage({ type: MSG.CLEAR_ACTIVE_FILLING_SESSION }).catch(() => {
                });
                activeSessionCred = null;
                stopAutofillPolling();
                if (settings.autoSubmitEnabled) {
                  setTimeout(() => submitForm(el), 150);
                }
              }
            }).catch((err) => {
              activeSessionCred = savedCred;
              console.error(err);
            });
          }
        }
      }
    }, 500);
  }
  function stopAutofillPolling() {
    if (autofillPollInterval) {
      clearInterval(autofillPollInterval);
      autofillPollInterval = null;
    }
  }
  function scan(root = document) {
    if (root.tagName === "INPUT") {
      attach(root);
    }
    root.querySelectorAll?.("input").forEach(attach);
  }
  var mo = new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n);
  });
  function bindContentActivityTracking() {
    let lastTouch = 0;
    const touch = () => {
      const now = Date.now();
      if (now - lastTouch < 1e4) return;
      lastTouch = now;
      chrome.runtime.sendMessage({ type: MSG.TOUCH_SESSION }).catch(() => {
      });
    };
    ["pointerdown", "keydown", "input", "scroll"].forEach((name) => {
      window.addEventListener(name, touch, true);
    });
  }
  scan();
  mo.observe(document.documentElement, { childList: true, subtree: true });
  bindContentActivityTracking();
  (function initSmartReposition() {
    if (document.readyState === "complete") return;
    let pageLoaded = false;
    const doReposition = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          repositionAll();
        });
      });
    };
    window.addEventListener("load", () => {
      pageLoaded = true;
      doReposition();
    }, { once: true });
    setTimeout(() => {
      if (!pageLoaded) {
        doReposition();
      }
    }, 1e3);
  })();
  chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }).then((res) => {
    if (res?.success && res.settings) {
      settings = { ...settings, ...res.settings };
      if (settings.autoFillSingleMatch) {
        triggerSingleMatchAutofill();
      }
    }
  }).catch(() => {
  });
  chrome.runtime.sendMessage({ type: MSG.GET_ACTIVE_FILLING_SESSION }).then((res) => {
    if (res?.success && res.session) {
      activeSessionCred = res.session.cred;
      activeSessionTime = res.session.timestamp;
      startAutofillPolling();
    }
  }).catch(() => {
  });
  chrome.runtime.onMessage.addListener((m) => {
    if (m.type === MSG.UPDATE_SETTINGS && m.settings) {
      settings = { ...settings, ...m.settings };
      const resolvedTheme = settings.theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : settings.theme;
      if (panelEl) {
        panelEl.setAttribute("data-theme", resolvedTheme);
      }
      const modal = document.querySelector(".okey-modal");
      if (modal) {
        modal.setAttribute("data-theme", resolvedTheme);
      }
    }
  });
})();
//# sourceMappingURL=content.js.map
