/* Copied from who_is_god.html script block 2 (Devotions v1.38). Edits are listed in WhoIsGod.js. */

  // ===== SEVEN CHURCHES DATA =====
  var CHURCH_DENOM_DATA = {
    ephesus: {
      label: "Ephesian Tendency — Doctrinally Precise, Risk of Lovelessness",
      denoms: [
        {di:22,name:"Churches of Christ (a cappella)",pct:55,why:"A restoration movement built on testing every practice against the text ('speak where the Bible speaks'), with strong doctrinal precision. The same instinct has produced repeated divisions over fine points of 'authorization,' and a debating culture that can narrow love to those who meet the pattern. The strength and the danger are the same trait."},
        {di:8,name:"Reformed / Calvinist",pct:45,why:"High doctrinal precision, systematic theology, strong rejection of error, but historically prone to cold orthodoxy and harsh treatment of dissenters. The strength and the danger."},
        {di:45,name:"Sacred Name (Assemblies of Yahweh)",pct:45,why:"Very high precision on the Name and on practice, and a firm refusal to tolerate what it sees as error (Rev 2:2). The Ephesian risk is that correctness about spelling and pattern outruns warmth, and the many small Sacred Name factions often split over exactly that."},
        {di:10,name:"Lutheran (Confessional)",pct:40,why:"Confessional precision valued above relational encounter in many expressions. Catechesis can become a substitute for transformation."},
        {di:4,name:"WCG (Original HWA Era)",pct:40,why:"The Armstrong-era church tested everything against its own reading of scripture and refused to tolerate perceived error, but did it through fear and control. Love as 1 Cor 13 describes it was not the culture (see its Love score of 4)."},
        {di:44,name:"Armstrongite Splinters (UCG / LCG / PCG)",pct:40,why:"The same doctrinal exactness as the parent body, with a history of 'one true church' claims and disfellowshipping. Many members are warm, but correction tends to be more visible than love."},
        {di:9,name:"Southern Baptist (Conservative)",pct:35,why:"Strong doctrinal standards and rejection of false teaching, but the Baptist emphasis on conversion experience tends to preserve some first-love warmth."},
        {di:6,name:"Conservative Anabaptist",pct:35,why:"Rigorous doctrinal standards and separation from the world, but community emphasis tends to preserve warmth. A lower Ephesian score than Reformed."},
        {di:16,name:"Jehovah's Witnesses",pct:35,why:"A rigorous rejection of what it counts as false teaching and a firm refusal to tolerate error (Rev 2:2), but enforced through shunning, which is the opposite of the first love Ephesus lost."},
        {di:34,name:"Oneness Pentecostal (UPCI)",pct:35,why:"Great precision about the formula (baptism in Jesus' name, one person in the Godhead) and strict standards, with real devotion. The risk is that being right on the formula becomes the measure of standing, which narrows love toward outsiders (see its Doctrine and Love cells)."},
        {di:1,name:"Hebrew Roots (balanced)",pct:30,why:"A rigorous study focus can produce Ephesian tendencies: correct in doctrine, sometimes cold in community expression."},
        {di:2,name:"Nazarene Israel / Netzarim",pct:30,why:"A rigorous return-to-the-source study, with the same risk as Hebrew Roots: correct on practice, with warmth uneven and isolation in some smaller branches."},
        {di:5,name:"Seventh-Day Adventist",pct:30,why:"A careful doctrinal system and strong Sabbath and health teaching, but the investigative-judgment doctrine produces an anxiety that works against love ('perfect love casts out fear,' 1 John 4:18)."},
        {di:40,name:"Iglesia ni Cristo",pct:30,why:"Absolute confidence that it alone is the true church, and strict discipline. The scorecard's Love and Humility scores (4 and 3) show where precision outweighs warmth."},
        {di:7,name:"Eastern Orthodox",pct:25,why:"A deep doctrinal tradition and rejection of heresy, but liturgical warmth and theosis theology tend to preserve love alongside precision."},
        {di:31,name:"Anglican Church in North America (ACNA)",pct:25,why:"Left the Episcopal Church to guard historic doctrine, a real Ephesian strength. Pastoral warmth is a stated value, though boundary disputes have at times turned bitter."},
        {di:3,name:"Church of God (7th Day)",pct:25,why:"Doctrinally careful and scripture-focused, but a warm, community-centered life tends to preserve first love."},
        {di:46,name:"Black Hebrew Israelites",pct:25,why:"Intense confidence in its own reading of scripture and a sharp rejection of other claimants. Where other peoples are called impostors, love of neighbor (Matt 22:39) has gone, as its Love score of 2 shows."},
        {di:15,name:"Roman Catholic",pct:20,why:"Strong institutional doctrinal authority, but the pastoral care tradition and Marian devotion tend to counterbalance cold orthodoxy."},
        {di:0,name:"Messianic (Torah-observant)",pct:20,why:"Doctrinal rigor is present, but the movement's identity as a 'return' tends to preserve genuine first-love zeal rather than cold precision."}
      ]
    },
    smyrna: {
      label: "Smyrnan Tendency — Suffering, Persecuted, Spiritually Rich",
      denoms: [
        {di:29,name:"African Methodist Episcopal (AME)",pct:65,why:"Founded in 1816 as a protest against segregated worship, the church was shaped by slavery, Jim Crow and church burnings. In 2015 members at Mother Emanuel in Charleston forgave the man who killed nine of them at Bible study, which is Smyrna's faithfulness unto death (Rev 2:10) lived in public."},
        {di:42,name:"Oriental Orthodox (Coptic / Ethiopian)",pct:65,why:"Centuries under hostile rule and persecution in Egypt and Ethiopia, and the 2015 martyrdom of 21 Coptic Christians in Libya. Among the most persecution-formed bodies on the scorecard (Endure 9)."},
        {di:6,name:"Conservative Anabaptist",pct:60,why:"The Anabaptist tradition was born in persecution, with thousands martyred by both Catholics and Protestants in the 16th century. Willingness to suffer for nonconformity is a core identity marker."},
        {di:20,name:"Amish",pct:60,why:"The Martyrs Mirror sits in nearly every home, and the community's ancestors were drowned, burned and imprisoned. The 2006 Nickel Mines forgiveness shows the same spirit today."},
        {di:27,name:"National Baptist (historically Black Baptist)",pct:60,why:"A church that was the one protected institution of enslaved and segregated people, with a history of church bombings and burnings. Suffering and faithfulness were formative, and Black Baptist pulpits led the civil rights movement."},
        {di:21,name:"Mennonite (Traditional)",pct:55,why:"The same 16th-century martyr root as the Amish: the Martyrs Mirror, conscientious objection at cost in both World Wars, and five hundred years of distinct identity under pressure."},
        {di:0,name:"Messianic (Torah-observant)",pct:55,why:"Leaving mainstream Christianity at social and familial cost. Many face rejection from both Jewish and Christian communities. This is modern Smyrna: small, countercultural and pressured."},
        {di:2,name:"Nazarene Israel / Netzarim",pct:55,why:"Fringe status, rejection by the mainstream and deliberate countercultural observance: a classic Smyrnan profile."},
        {di:1,name:"Hebrew Roots (balanced)",pct:50,why:"Similar to Messianic: the social cost of Sabbath observance and feast-keeping in a Sunday-Christian culture produces genuine Smyrnan experience."},
        {di:32,name:"Church of God in Christ (COGIC)",pct:50,why:"Born in the Jim Crow South. Bishop Mason was arrested in 1918 for his pacifism, and the early church was threatened by mobs. Poor, persecuted and spiritually rich is its founding picture."},
        {di:43,name:"Quaker (Religious Society of Friends)",pct:50,why:"Imprisoned in 17th-century England, and Mary Dyer was hanged in Boston in 1660 for returning to preach. Quakers refused to fight, swear oaths or compromise, at great cost."},
        {di:7,name:"Eastern Orthodox",pct:45,why:"Centuries under Ottoman rule and decades of Soviet persecution, with many martyrs. Endurance is a defining mark (Endure 7), though ethnic establishment in some countries cuts the other way."},
        {di:5,name:"Seventh-Day Adventist",pct:40,why:"Historical persecution of Sabbath-keepers and a willingness to be countercultural on Saturday worship and dietary standards. Early Adventist history has genuine Smyrnan suffering."},
        {di:16,name:"Jehovah's Witnesses",pct:35,why:"A history of genuine persecution: conscientious objection, blood-transfusion refusal at personal cost, and door-to-door work at social cost. Smyrnan suffering is real even where theology diverges."},
        {di:3,name:"Church of God (7th Day)",pct:35,why:"A small, persecuted history and countercultural Sabbath keeping: genuine Smyrnan markers."},
        {di:4,name:"WCG (Original HWA Era)",pct:35,why:"Members lost jobs and family relationships over the Sabbath and holy days. Real suffering for a countercultural practice, though inside an authoritarian system."},
        {di:44,name:"Armstrongite Splinters (UCG / LCG / PCG)",pct:30,why:"The same Sabbath and holy-day cost as the parent body, with lost work and strained families, but no persecution at state level."},
        {di:33,name:"Assemblies of God",pct:30,why:"In China, Africa and Latin America the Assemblies of God and its sister churches face real persecution and grow under it. The American church is comfortable, so the score averages the two."},
        {di:17,name:"LDS (Mormon)",pct:25,why:"Real historical persecution (Nauvoo, and Missouri's 1838 extermination order) and pioneer endurance, though the modern American church is socially respected."},
        {di:15,name:"Roman Catholic",pct:25,why:"Two things are true. In much of Western history the church was the persecutor (the Inquisition, Reformation-era violence). Today Catholics are among the most persecuted believers in parts of Africa, Asia and the Middle East, with a long martyr tradition. The score averages both."}
      ]
    },
    pergamum: {
      label: "Pergamum Tendency — Faithful Confession, Cultural Compromise",
      denoms: [
        {di:18,name:"Prosperity Gospel",pct:70,why:"Maintains the Name of Yeshua while teaching that wealth is the sign of God's favor, directly parallel to eating food sacrificed to idols in Pergamum's context."},
        {di:14,name:"Anglican / Episcopalian",pct:65,why:"Born as a compromise between Rome and the Reformation for political reasons. Has maintained Christian confession while accommodating significant cultural revision, such as women bishops and same-sex blessings in some provinces. A classic Pergamum profile."},
        {di:24,name:"United Church of Christ",pct:60,why:"Holds the Name of Christ in its statement of faith while its General Synod revised marriage ethics in 2005 and treats scripture as one voice among several. The pattern is Balaam's: faithful confession alongside accommodation of what the culture now approves."},
        {di:15,name:"Roman Catholic",pct:55,why:"Strong doctrinal confession alongside a long alliance with imperial and political power (Pergamum was where Rome's throne stood), documented institutional cover-up, and practices with pre-Christian origins (the scorecard's lowest Purity score among Christian bodies, 2)."},
        {di:12,name:"Methodist / Wesleyan",pct:55,why:"A strong social-gospel emphasis has in many branches led to accommodation of cultural progressive ethics alongside genuine Christian confession."},
        {di:25,name:"Presbyterian Church (U.S.A.)",pct:55,why:"Confesses Christ and keeps the historic Book of Confessions, but moved in 2011 and 2015 to accept what Lev 18, Rom 1 and 1 Cor 6:9-11 name. Faithful confession alongside accommodation."},
        {di:26,name:"Evangelical Lutheran Church in America (ELCA)",pct:55,why:"Keeps the creeds while its 2009 Churchwide Assembly set aside the plain reading on sexuality under 'bound conscience.' A church that keeps the Name and tolerates the compromise."},
        {di:35,name:"Charismatic Megachurch / NAR (Bethel, Hillsong style)",pct:55,why:"A strong confession of Yeshua alongside worship modeled on the entertainment industry, celebrity leadership and 'dominion' politics that join the church to worldly power."},
        {di:23,name:"Christian Church (Disciples of Christ)",pct:50,why:"Welcomes everyone to Christ's table while leaving moral questions to conscience. The open-belief model is the opposite of the testing that Rev 2:14-15 commands."},
        {di:11,name:"Non-Denom Evangelical",pct:50,why:"A flexible theological identity makes cultural accommodation easier. Many non-denominational churches have adopted cultural entertainment, marketing strategies and softened ethics while retaining Christian branding."},
        {di:13,name:"Pentecostal / Charismatic",pct:45,why:"A strong confession of Yeshua's name alongside accommodation of prosperity theology, celebrity culture and uncritical embrace of cultural entertainment."},
        {di:41,name:"Community of Christ (formerly RLDS)",pct:45,why:"Holds Christ as Savior while its 2013 U.S. decisions changed marriage and ordination, and its open canon lets leadership amend practice. Confession kept, standards revised."},
        {di:28,name:"American Baptist Churches USA",pct:45,why:"Official statements have stood for traditional ethics, but because each congregation decides, accommodation spreads through local autonomy."},
        {di:7,name:"Eastern Orthodox",pct:40,why:"Faithful confession through persecution, with deep entanglement in national and state power across history, and practices with pre-Christian parallels (Purity 4)."},
        {di:39,name:"Unity / New Thought",pct:40,why:"Uses Christian language and honors Jesus while blending every spiritual path, which mixes the Name with other teachings (Rev 2:14)."},
        {di:10,name:"Lutheran (Confessional)",pct:30,why:"Confessional Lutheranism maintains the Word, but broader Lutheran bodies carry significant Pergamum accommodation (the ELCA is scored separately). Confessional expressions score lower."},
        {di:33,name:"Assemblies of God",pct:30,why:"Strong confession and conservative ethics, though entertainment-style worship and prosperity-adjacent streams enter in places."},
        {di:36,name:"Calvary Chapel",pct:30,why:"Faithful, text-centered teaching with the casual, culturally shaped style of its Jesus People roots. The accommodation is modest."},
        {di:37,name:"Real Life Ministries (non-denominational network)",pct:30,why:"A discipleship-driven church with conservative ethics. The accommodation is mostly in contemporary-culture worship style and megachurch marketing."},
        {di:9,name:"Southern Baptist (Conservative)",pct:25,why:"Stronger on cultural separation than many Protestant groups, but prosperity and culture-war accommodation creep in many Baptist contexts."}
      ]
    },
    thyatira: {
      label: "Thyatira Tendency — Loving but Undiscerning, Tolerates False Teaching",
      denoms: [
        {di:35,name:"Charismatic Megachurch / NAR (Bethel, Hillsong style)",pct:70,why:"Living prophets and apostles whose words are received without the testing that Deut 13:1-5 and 18:20-22 require. Warm, serving and growing, but tolerating a prophetess who teaches (Rev 2:20) is this movement's characteristic risk."},
        {di:13,name:"Pentecostal / Charismatic",pct:65,why:"Genuine love, service and works, often growing. But the movement's embrace of every claimed prophetic word, healing claim and spiritual experience without rigorous testing is textbook Thyatira. Jezebel in this context is the uncritical prophetic voice."},
        {di:23,name:"Christian Church (Disciples of Christ)",pct:60,why:"Radical welcome and service with no doctrine to test. Love without discernment is the Thyatiran trap."},
        {di:24,name:"United Church of Christ",pct:60,why:"Genuine compassion and service alongside revised standards in the name of inclusion. Thyatira's works greater than the first, with tolerance of Jezebel."},
        {di:18,name:"Prosperity Gospel",pct:60,why:"An emphasis on blessing, love and positive confession produces a warm community, but the tolerance of health-and-wealth teaching alongside Yeshua's name is precisely the Thyatira pattern."},
        {di:12,name:"Methodist / Wesleyan",pct:55,why:"A strong emphasis on love, social service and community, which are genuine Thyatiran strengths. The failure: progressive branches have accommodated doctrinal revision in the name of inclusion and love."},
        {di:26,name:"Evangelical Lutheran Church in America (ELCA)",pct:55,why:"A warm, serving church that rarely confronts error because 'bound conscience' lets opposite readings co-exist."},
        {di:39,name:"Unity / New Thought",pct:55,why:"Very warm and prayer-centered. The mixing of other teachings with Jesus' name is tolerated as love."},
        {di:41,name:"Community of Christ (formerly RLDS)",pct:55,why:"Peace-making and welcome are its identity, alongside an open canon and a prophet-president who can revise practice."},
        {di:11,name:"Non-Denom Evangelical",pct:50,why:"Warm community, strong service culture and genuine care, alongside low doctrinal discernment and susceptibility to visiting teachers who are not tested."},
        {di:25,name:"Presbyterian Church (U.S.A.)",pct:50,why:"A serving church that accepts a wide range of belief within ordination 'scruples' and conscience."},
        {di:14,name:"Anglican / Episcopalian",pct:45,why:"Liturgical warmth and a genuine service tradition alongside tolerance of doctrinal revision in the name of pastoral charity."},
        {di:28,name:"American Baptist Churches USA",pct:45,why:"Warm local churches, where local autonomy tolerates whatever a congregation chooses."},
        {di:43,name:"Quaker (Religious Society of Friends)",pct:45,why:"A tradition of tenderness and service in which the Inner Light can validate whatever a person already believes, a weak test against Deut 13."},
        {di:32,name:"Church of God in Christ (COGIC)",pct:40,why:"Deep love and service with strong moral teaching, but prophetic utterance is not routinely tested against scripture."},
        {di:33,name:"Assemblies of God",pct:40,why:"Real works of compassion and a committed people, though prophecy and manifestations are tested unevenly."},
        {di:15,name:"Roman Catholic",pct:35,why:"A warm pastoral tradition and genuine works of mercy, alongside institutional tolerance of theological heterodoxy at various levels."},
        {di:38,name:"Christian Science",pct:35,why:"Gentle and caring in tone, with a founder's teaching (that sin and sickness are unreal) welcomed without testing against scripture."},
        {di:37,name:"Real Life Ministries (non-denominational network)",pct:30,why:"A relational, caring model with accountability inside the elder structure, but no outside check."},
        {di:36,name:"Calvary Chapel",pct:25,why:"Strong text-based teaching reduces the risk, though the senior-pastor model limits correction."}
      ]
    },
    sardis: {
      label: "Sardis Tendency — Reputation Without Reality, Institutional Without Life",
      denoms: [
        {di:24,name:"United Church of Christ",pct:70,why:"A church of great historical prestige (the heirs of the Pilgrims), with membership down from about 2.1 million in 1957 to under 1.2 million and a thinned confessional center. The reputation outlasts the life."},
        {di:25,name:"Presbyterian Church (U.S.A.)",pct:70,why:"A large institutional heritage and many historic buildings, with steady numerical decline and a 'scruples' system that lets ordinands decline standards. Membership is more inherited than chosen."},
        {di:26,name:"Evangelical Lutheran Church in America (ELCA)",pct:65,why:"A historic Lutheran heritage and a great institutional footprint, though many congregations are aging and attendance is cultural."},
        {di:23,name:"Christian Church (Disciples of Christ)",pct:65,why:"Once a frontier revival movement, now an institution in long decline."},
        {di:14,name:"Anglican / Episcopalian",pct:60,why:"Centuries of institutional prestige, beautiful architecture and formal liturgy, and in many Western expressions shrinking genuine faith and aging congregations."},
        {di:28,name:"American Baptist Churches USA",pct:50,why:"A large property base and denominational structures, with aging congregations."},
        {di:15,name:"Roman Catholic",pct:45,why:"An enormous institutional presence with declining Mass attendance in Western nations. The institution remains while the vitality contracts."},
        {di:41,name:"Community of Christ (formerly RLDS)",pct:45,why:"A small, aging membership with a strong institutional identity (the temple and headquarters in Independence)."},
        {di:38,name:"Christian Science",pct:45,why:"A once-prominent movement with grand churches and reading rooms. Congregations have closed, and practitioners fell from about 8,000 in the early 1960s to about 2,000. The reputation outlasts the life."},
        {di:12,name:"Methodist / Wesleyan",pct:40,why:"Once a revival movement, now in many expressions an institution. The United Methodist split reflects a Sardis body trying to find what remains alive."},
        {di:19,name:"Unitarian Universalist",pct:40,why:"A refined, prestigious institution with a reputation for social goodness and little confessing life: Rev 3:1's 'name for being alive' without a Name."},
        {di:10,name:"Lutheran (Confessional)",pct:35,why:"Confessional Lutheranism retains genuine faith, but even confessional bodies face the Sardis drift of inherited membership over genuine conversion."},
        {di:43,name:"Quaker (Religious Society of Friends)",pct:35,why:"Aging meetings in many places, with a historic reputation larger than current numbers. Some branches are lively."},
        {di:7,name:"Eastern Orthodox",pct:30,why:"A strong liturgical tradition and genuine theology, but in many diaspora contexts Orthodoxy is ethnic identity more than genuine faith, a Sardis pattern."},
        {di:39,name:"Unity / New Thought",pct:30,why:"The inherited prestige of a century-old movement, with declining attendance."},
        {di:9,name:"Southern Baptist (Conservative)",pct:25,why:"Cultural Christianity in the American South produces genuine Sardis patterns: church membership as social identity rather than genuine discipleship."},
        {di:27,name:"National Baptist (historically Black Baptist)",pct:25,why:"A large and storied institution whose member churches face declining membership and financial strain, per published reporting."},
        {di:22,name:"Churches of Christ (a cappella)",pct:25,why:"A strong heritage identity, with membership declining in many regions."},
        {di:11,name:"Non-Denom Evangelical",pct:20,why:"Less institutional history reduces the Sardis tendency, but megachurch consumer culture can produce a different version of the same pattern."},
        {di:8,name:"Reformed / Calvinist",pct:20,why:"Mainline Reformed bodies share the institutional drift, but confessional Reformed bodies retain real life, so the score is low."}
      ]
    },
    philadelphia: {
      label: "Philadelphian Tendency — Faithful, Word-Keeping, No Rebuke",
      denoms: [
        {di:0,name:"Messianic (Torah-observant)",pct:75,why:"Highest Philadelphian score: small in cultural power, holds the full word without compromise, affirms the Name, and keeps the word of His endurance through social cost. The pattern most closely matching Yeshua's description."},
        {di:1,name:"Hebrew Roots (balanced)",pct:70,why:"Very similar to Messianic: genuine fidelity to the word at personal cost, no cultural power, holding the Name."},
        {di:2,name:"Nazarene Israel / Netzarim",pct:68,why:"A deliberate return to first-century practice, small and countercultural, with high fidelity to the word. A strong Philadelphian profile."},
        {di:6,name:"Conservative Anabaptist",pct:60,why:"Separation from the world, genuine suffering-willingness and community integrity are significant Philadelphian markers, though the closed-community structure limits the 'open door' missional aspect."},
        {di:45,name:"Sacred Name (Assemblies of Yahweh)",pct:58,why:"Small, Name-honoring and word-keeping (Sabbath, feasts, food laws), countercultural, and faithful at social cost. The deductions are Name-form dogmatism and a narrow circle of fellowship (Doctrine 4, Love 5)."},
        {di:3,name:"Church of God (7th Day)",pct:55,why:"Small, Sabbath-keeping, Torah-adjacent in some expressions and historically countercultural: genuine Philadelphian tendencies."},
        {di:20,name:"Amish",pct:55,why:"Small, plain and unashamed, keeping the word of endurance through suffering and refusing retaliation. The missing piece is Torah (Sabbath, feasts, diet), and the closed community limits the 'open door.'"},
        {di:44,name:"Armstrongite Splinters (UCG / LCG / PCG)",pct:50,why:"Keeps the word, including Sabbath, holy days and clean meats, at personal cost. The deductions are an authoritarian history, British Israelism, and the teaching of the Spirit as power."},
        {di:21,name:"Mennonite (Traditional)",pct:50,why:"Nonresistance, simple living and global service at cost. Like the Amish, strong on endurance and love, lacking the Torah markers."},
        {di:5,name:"Seventh-Day Adventist",pct:45,why:"Strong on Sabbath and prophecy, but institutional size and internal doctrinal disputes (the investigative judgment, and the health message as a salvation requirement in some expressions) reduce the Philadelphian score."},
        {di:42,name:"Oriental Orthodox (Coptic / Ethiopian)",pct:45,why:"Unbroken fidelity under centuries of pressure and, in the Ethiopian church, a retained Sabbath, circumcision and food laws. The deductions are the weight of tradition and ethnic establishment."},
        {di:4,name:"WCG (Original HWA Era)",pct:40,why:"Strong on word-keeping and Sabbath, but authoritarian leadership and doctrinal overreach reduce the Philadelphian score. The remnant that retained truth after the 1990s changes may score higher."},
        {di:22,name:"Churches of Christ (a cappella)",pct:40,why:"Small, word-centered and unwilling to add to scripture, with a strong Berean testing instinct. Lacking the Sabbath and Torah continuity, and its sectarian exclusivity narrows the open door."},
        {di:30,name:"Nazarene / Wesleyan Holiness",pct:35,why:"Faithful to the text and to holiness, with a heart-law theology that echoes Jer 31:33. No Sabbath, feasts or diet."},
        {di:27,name:"National Baptist (historically Black Baptist)",pct:30,why:"Faithful under pressure for centuries and a church of the little and the poor. It lacks Torah markers and carries uneven doctrinal accountability."},
        {di:31,name:"Anglican Church in North America (ACNA)",pct:30,why:"A costly stand for the plain reading of scripture on marriage and authority, within a liturgical tradition and without Torah markers."},
        {di:43,name:"Quaker (Religious Society of Friends)",pct:30,why:"Faithful under persecution and committed to peace and truthfulness, though scripture is not the final authority in liberal meetings."},
        {di:36,name:"Calvary Chapel",pct:25,why:"Faithful text-teaching and small-church roots. Its pretribulational expectation reads Rev 3:10 as escape, a reading this document weighs below preservation-through (see the Pre/Mid/Post tab)."},
        {di:9,name:"Southern Baptist (Conservative)",pct:20,why:"Individual Baptists can carry Philadelphian character. The tradition as a whole carries significant cultural Christianity alongside genuine faith."},
        {di:8,name:"Reformed / Calvinist",pct:20,why:"Strong on word-fidelity, but cultural power-seeking (Christian nationalism in some expressions) contradicts the Philadelphian 'little strength' profile."}
      ]
    },
    laodicea: {
      label: "Laodicean Tendency — Comfortable, Self-Sufficient, Lukewarm",
      denoms: [
        {di:18,name:"Prosperity Gospel",pct:85,why:"The prosperity gospel is Laodicea made into a theology. 'I am rich, I have prospered, I need nothing' is the explicit confession of health-and-wealth teaching. Yeshua's verdict is identical."},
        {di:11,name:"Non-Denom Evangelical",pct:60,why:"Consumer church culture, entertainment-driven services, a low commitment threshold and cultural Christianity. Western megachurch culture is the Laodicean church institutionalized."},
        {di:35,name:"Charismatic Megachurch / NAR (Bethel, Hillsong style)",pct:60,why:"Platform, production and 'favor' theology: 'I am rich, I have prospered' in a ministry model, with spiritual need rarely named."},
        {di:19,name:"Unitarian Universalist",pct:55,why:"Maximum comfort, minimum cost and no clear confession: the lukewarm position by definition. Neither cold (hostile) nor hot (committed). Comfortable spiritual exploration without genuine surrender."},
        {di:39,name:"Unity / New Thought",pct:50,why:"A comfortable, self-affirming spirituality with the cost of discipleship removed. 'I am rich and need nothing' becomes the doctrine that every person is already divine."},
        {di:14,name:"Anglican / Episcopalian",pct:45,why:"Cultural Christianity, comfortable liturgy and a low cost of discipleship in many Western expressions: significant Laodicean tendencies alongside Sardis."},
        {di:24,name:"United Church of Christ",pct:45,why:"Comfortable, respectable and affluent in many places, with an easy discipleship of no cost and no offense (see Endure 2)."},
        {di:47,name:"Church of Scientology",pct:40,why:"A self-help system in which spiritual advancement is bought from the organization and the person is the source of their own rescue. The reverse of 'buy from me gold refined by fire' (Rev 3:18)."},
        {di:12,name:"Methodist / Wesleyan",pct:40,why:"In Western mainline expressions, comfort and cultural Christianity have replaced the Wesleyan revival fire that marked the movement's founding."},
        {di:25,name:"Presbyterian Church (U.S.A.)",pct:40,why:"Affluent, comfortable mainline congregations with a low cost of discipleship."},
        {di:26,name:"Evangelical Lutheran Church in America (ELCA)",pct:40,why:"Comfortable, well-resourced congregations in which discipleship asks little."},
        {di:23,name:"Christian Church (Disciples of Christ)",pct:40,why:"Comfortable mainline congregations where the cost of discipleship is low and need is rarely named."},
        {di:13,name:"Pentecostal / Charismatic",pct:35,why:"In Western celebrity-preacher expressions, emotional experience substitutes for genuine hot commitment. The feeling of being hot while being lukewarm is a Laodicean trap."},
        {di:15,name:"Roman Catholic",pct:35,why:"Cultural Catholicism (baptized, confirmed, Christmas-and-Easter attendance) is widespread Laodicean practice."},
        {di:28,name:"American Baptist Churches USA",pct:35,why:"Comfortable moderate congregations with a low cost of discipleship."},
        {di:37,name:"Real Life Ministries (non-denominational network)",pct:35,why:"A large, growing, well-run megachurch, where the risk is the comfort and platform of success. Its discipleship model counters it."},
        {di:38,name:"Christian Science",pct:35,why:"Genteel, comfortable and self-sufficient, and it denies the very poverty and need that Rev 3:17 names."},
        {di:9,name:"Southern Baptist (Conservative)",pct:30,why:"Cultural Christianity in the Bible Belt, with church membership as social belonging rather than genuine discipleship, is a widespread Laodicean pattern."},
        {di:41,name:"Community of Christ (formerly RLDS)",pct:30,why:"Comfortable and well-resourced for its size, with a low cost of discipleship."},
        {di:36,name:"Calvary Chapel",pct:30,why:"Casual, comfortable worship and a low commitment threshold in some congregations, offset by serious Bible teaching."}
      ]
    }
  };

  function showChurch(id) {
    document.querySelectorAll('.church-panel').forEach(function(p){ p.style.display='none'; });
    document.querySelectorAll('.church-btn').forEach(function(b){
      b.style.background='var(--navy)'; b.style.color='var(--parchment)'; b.style.fontWeight='';
    });
    var panel = document.getElementById('church-'+id);
    if(panel) panel.style.display='block';
    var btn = document.getElementById('btn-'+id);
    if(btn){ btn.style.background='var(--gold)'; btn.style.color='var(--navy)'; btn.style.fontWeight='700'; }
    buildChurchDenomMap(id);
  }

  function buildChurchDenomMap(churchId) {
    var data = CHURCH_DENOM_DATA[churchId];
    if(!data) return;
    var el = document.getElementById('denom-map-'+churchId);
    if(!el) return;
    var sorted = data.denoms.slice().sort(function(a,b){return b.pct-a.pct;});
    var html = '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">';
    sorted.forEach(function(d,i){
      var color = d.pct>=60?'var(--deep-red)':d.pct>=40?'#b8860b':'var(--navy)';
      html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
      html += '<div onclick="showChurchPct(\''+churchId+'\','+i+')" title="Click to learn what this church is" style="min-width:220px;font-size:0.93em;font-weight:600;cursor:pointer;text-decoration:underline dotted var(--gold);">'+d.name+'</div>';
      html += '<div style="flex:1;min-width:140px;background:#e8e0d0;border-radius:3px;height:18px;position:relative;">';
      html += '<div style="width:'+d.pct+'%;background:'+color+';height:100%;border-radius:3px;transition:width 0.4s;"></div></div>';
      html += '<span onclick="showChurchPct(\''+churchId+'\','+i+')" style="font-weight:700;color:'+color+';cursor:pointer;min-width:44px;text-align:right;padding:3px 7px;border-radius:4px;border:1px solid '+color+';background:rgba(0,0,0,.04);transition:background .15s;" onmouseover="this.style.background=\'rgba(0,0,0,.1)\'" onmouseout="this.style.background=\'rgba(0,0,0,.04)\'">'+d.pct+'%</span>';
      html += '</div>';
    });
    html += '</div>';
    var lab = (typeof CHURCH_LABELS !== 'undefined' && CHURCH_LABELS[churchId]) || churchId;
    var explainer = '<div style="background:rgba(27,42,74,.05);border-left:3px solid var(--gold);border-radius:0 5px 5px 0;padding:10px 14px;font-size:.86em;line-height:1.7;margin-top:6px;"><strong style="font-family:Cinzel,serif;font-size:.8em;letter-spacing:.08em;">WHAT THIS MAP SHOWS</strong><br>Each bar shows how strongly a church\'s published teaching and practice match the '+lab+' pattern in Yeshua\'s letter. It is a tendency, not a verdict, and most movements show several patterns at once. These are the 20 of the 48 churches on the scorecard that show this pattern most strongly. Click a church name or its percentage to learn what that church is and why it scores where it does. Re-mapped 2026-10-04 against the full scorecard.</div>';
    el.innerHTML = explainer + html;
  }

  var CHURCH_LABELS = {
    ephesus:'Ephesian',smyrna:'Smyrnan',pergamum:'Pergamum',thyatira:'Thyatiran',
    sardis:'Sardis',philadelphia:'Philadelphian',laodicea:'Laodicean'
  };
  var CHURCH_COLORS = {
    ephesus:'#c0392b',smyrna:'#8e44ad',pergamum:'#d35400',thyatira:'#2980b9',
    sardis:'#7f8c8d',philadelphia:'#27ae60',laodicea:'#b7950b'
  };
  var CHURCH_LETTERS = {
    ephesus:'Rev 2:1–7',smyrna:'Rev 2:8–11',pergamum:'Rev 2:12–17',thyatira:'Rev 2:18–29',
    sardis:'Rev 3:1–6',philadelphia:'Rev 3:7–13',laodicea:'Rev 3:14–22'
  };
  var CHURCH_COMMEND = {
    ephesus:'Cannot tolerate evil; tested false apostles; has endurance',
    smyrna:'Rich in tribulation; faithful under persecution; holds fast',
    pergamum:'Holds to the name of Yeshua; did not deny the faith even where the enemy dwells',
    thyatira:'Love, service, faith, and patience — greater works now than at first',
    sardis:'A few names who have not defiled their garments',
    philadelphia:'Kept the Word; not denied the name; kept the command to endure',
    laodicea:'...(no commendation given)'
  };
  var CHURCH_WARN = {
    ephesus:'Left your first love — remember, repent, do the first works',
    smyrna:'(No rebuke — only encouragement: be faithful unto death)',
    pergamum:'Holds to the doctrine of Balaam; has those who hold Nicolaitan doctrine',
    thyatira:'Tolerates Jezebel who teaches fornication and eating things sacrificed to idols',
    sardis:'Has a name of being alive but is dead — works not found complete before God',
    philadelphia:'(No rebuke — only the promise of the open door and the crown)',
    laodicea:'Lukewarm — neither hot nor cold; says "I am rich" but is wretched, miserable, poor, blind, naked'
  };

  function showChurchPct(churchId, idx) {
    var data = CHURCH_DENOM_DATA[churchId];
    if (!data) return;
    var sorted = data.denoms.slice().sort(function(a,b){return b.pct-a.pct;});
    var d = sorted[idx];
    var label = CHURCH_LABELS[churchId] || churchId;
    var color = CHURCH_COLORS[churchId] || 'var(--navy)';
    var ref = CHURCH_LETTERS[churchId] || '';
    var commend = CHURCH_COMMEND[churchId] || '';
    var warn = CHURCH_WARN[churchId] || '';
    var barColor = d.pct >= 60 ? '#c0392b' : d.pct >= 40 ? '#b8860b' : 'var(--navy)';
    var title = d.name + ' — ' + label + ' Tendencies';
    var aboutBlock = (typeof DENOM_ABOUT !== 'undefined' && d.di != null && DENOM_ABOUT[d.di]) ? '<div style="margin-top:16px;"><div style="font-family:Cinzel,serif;font-size:.74em;letter-spacing:.14em;text-transform:uppercase;color:#a8893f;margin-bottom:6px;">What this church is</div><div style="font-size:.94em;line-height:1.75;">'+DENOM_ABOUT[d.di]+'</div></div>' : '';
    var body = '<div style="margin-bottom:18px;">' +
      '<div style="font-family:Cinzel,serif;font-size:.75em;letter-spacing:.15em;text-transform:uppercase;color:'+color+';margin-bottom:6px;">'+label+' Church · '+ref+'</div>' +
      '<div style="font-size:.88em;color:#666;margin-bottom:14px;font-style:italic;">What Yeshua commended: <em style="color:#2e5e2e">'+commend+'</em></div>' +
      '<div style="font-size:.88em;color:#666;margin-bottom:18px;font-style:italic;">What Yeshua warned: <em style="color:#8b3030">'+warn+'</em></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">' +
      '<div style="flex:1;background:#e8e0d0;border-radius:4px;height:22px;overflow:hidden;">' +
      '<div style="width:'+d.pct+'%;background:'+barColor+';height:100%;border-radius:4px;transition:width .5s;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;">' +
      '<span style="color:#fff;font-size:.8em;font-weight:700;">'+d.pct+'%</span></div></div>' +
      '<span style="font-family:Cinzel,serif;font-size:1.1em;font-weight:700;color:'+barColor+';min-width:44px;text-align:right;">'+d.pct+'%</span></div>' +
      '<div style="background:rgba(27,42,74,.06);border-left:3px solid '+color+';padding:12px 16px;border-radius:0 6px 6px 0;font-size:.96em;line-height:1.78;color:var(--ink);">'+d.why+'</div>' + aboutBlock +
      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);font-size:.84em;color:#888;font-style:italic;">Tendency percentages are not absolute verdicts — most traditions contain elements of multiple churches. This is a lens, not a label. The goal is self-examination, not condemnation.</div>' +
      '<div style="margin-top:14px;"><button onclick="document.getElementById(\'church-pct-modal\').style.display=\'none\';showTab(\'scores\')" style="background:var(--navy);color:var(--parchment);border:none;border-radius:4px;padding:7px 14px;font-family:Cinzel,serif;font-size:.78em;letter-spacing:.08em;cursor:pointer;">See Full Scorecard →</button></div>';
    document.getElementById('church-pct-title').textContent = title;
    document.getElementById('church-pct-body').innerHTML = body;
    document.getElementById('church-pct-modal').style.display='flex';
  }

  document.addEventListener('DOMContentLoaded',function(){ showChurch('ephesus'); });
  
