export const rawTable = `b  ba bo bai bei bao ban ben bang beng bi bie biao bian bin bing
p  pa po pai pao pou pan pen pang peng pi pie piao pian pin ping
m  ma mo me mai mao mou man men mang meng mi mie miao miu mian min ming
f  fa fo fei fou fan fen fang feng
d  da de dai dei dao dou dan dang deng di die diao diu dian ding
t ta te tai tao tou tan tang teng ti tie tiao tian ting
n  na nai nei nao no nen nang neng ni nie niao niu nian nin niang ning
l  la le lai lei lao lou lan lang leng li lia lie liao liu lian lin liang ling
g  ga ge gai gei gao gou gan gen gang geng
k  ka ke kai kou kan ken kang keng
h ha he hai hei hao hou hen hang heng
j  ji jia jie jiao jiu jian jin jiang jing
q qi qia qie qiao qiu qian qin qiang qing
x  xi xia xie xiao xiu xian xin xiang xing
zh zha zhe zhi zhai zhao zhou zhan zhen zhang zheng
ch cha che chi chai chou chan chen chang cheng
sh sha she shi shai shao shou shan shen shang sheng
r re ri rao rou ran ren rang reng
z  za ze zi zai zao zou zang zeng
c  ca ce ci cai cao cou can cen cang ceng
s sa se si sai sao sou san sen sang seng
y  ya yao you yan yang yu ye yue yuan yi yin yun ying
w  wa wo wai wei wan wen wang weng wu`;

export const zeroLeadKeys = "a ai an ang ao e ei en eng er o ou".split(" ");

export const leadKeys = "b p m f d t n l g k h j q x zh ch sh r z c s y w"
  .split(" ")
  .concat(zeroLeadKeys);

export const singleFollowKeys = "a o e i u v".split(" ");

export const multiFollowKeys =
  "ai ei ui ao ou iu ie ve er an en in un vn ang eng ing ong".split(" ");

export const followKeys = singleFollowKeys.concat(multiFollowKeys);

export let validCombines: Map<string, Pinyin> = new Map();
export let leadMap: Map<string, Pinyin[]> = new Map();
export let followMap: Map<string, Pinyin[]> = new Map();

zeroLeadKeys.forEach((v) => validCombines.set(v, { lead: v, follow: "" }));

export const pinyinTable = rawTable
  .split("\n")
  .map((line) => {
    const items = line.split(" ").filter((v) => !!v);
    const lead = items[0];
    const follows = items.slice(1).map((v) => v.trim().replace(lead, ""));

    follows.forEach((follow) => {
      validCombines.set(lead + follow, {
        lead,
        follow,
      });
    });

    return [lead, follows];
  })
  .reduce(
    (pre, [lead, follow]) =>
      Object.assign(pre, {
        [lead as string]: new Set(follow as string[]),
      }),
    {}
  ) as { [_: string]: string[] };

function pushMap<K, V>(m: Map<K, V[]>, k: K, v: V) {
  if (!m.has(k)) {
    m.set(k, []);
  }

  m.get(k)!.push(v);
}

validCombines.forEach((v) => {
  pushMap(leadMap, v.lead, v);
  pushMap(followMap, v.follow, v);
});

export const pinyinSummary = {
  leadCount: leadKeys.length,
  followCount: followKeys.length,
  singleFollowCount: singleFollowKeys.length,
  multiFollowCount: multiFollowKeys.length,
};

export function getCombineOf(p: Pinyin) {
  return p.lead + p.follow;
}
