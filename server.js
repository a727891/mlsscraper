
var express = require('express');
//var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var minify = require('html-minifier').minify;
var app     = express();
var Schema = mongoose.Schema;
var port = '8080';
var mongoUrl = process.env.MONGOLAB_URI || 'mongodb://localhost/mls';
mongoose.connect(mongoUrl);

var listingSchema = Schema({
    "mls": String,
    "listingStatus": String,
    "userStatus": String,
    "address": String,
    "agentName": String,
    "office": String,
    "agentNumber": String,
    "officeNumber": String,
    "remarks": String,
    "price": String,
    "beds": String,
    "baths": String,
    "sqft": String,
    "lot": String,
    "year": String,
    "imageUrl": String,
    "lat": String,
    "lon": String,
    "RID": String
});
var listingModel = mongoose.model('listing', listingSchema);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('DB connection open');
});

var listingCache = 0;
var sessionId = 0;

//Serve static files from client folder
app.use(express.static(__dirname + '/client'));
app.get('/watch/:id', function(req, res){
    changeUserStatus(req, res,'Watched');
});
app.get('/ignore/:id', function(req, res){
    changeUserStatus(req, res,'Ignored');
});
app.get('/viewed/:id', function(req, res){
    changeUserStatus(req, res,'Viewed');
});
function changeUserStatus(req, res, value){
    listingModel.findOne({ mls: req.params.id }, function (err, doc){
        if(!err){
            doc.userStatus = value;
            doc.save();
            res.json(doc);
        } else {
            console.log('Error updating mls status ', req.params.id, value, err);
            res.send(504,'Database error');
        }
    });
}
app.get('/scrape', function(req, res){
    //shortcut to use cached
    if(listingCache>=Date.now()){
        console.log('use cached listings');
        scrapeReturn(res);
    }else{
        scrape(res);
    }
});
app.get('/test', function(req, res){
    res.send('App is working mongo url = ', mongoUrl);
});
function scrapeReturn(res){
    listingModel.find().sort([['price', 'ascending']]).exec(function(err,MasterList){
        res.json({
            cachedUntil:listingCache,
            session:sessionId,
            list:MasterList
        });
    });
}
function scrape(res){
    console.log('Scraping data from the web...');
    listingCache = Date.now() + 1800000;//cache for 30 mins;
    //var url1 = 'http://localhost:8080/test.html';
    var url0 = 'http://lubbock.rapmls.com/scripts/mgrqispi.dll?APPNAME=lubbock&ARGUMENTS=-N892648278%2C-N1843892%2C-APB%2C-N0&AreaLabel=Zone&AreaText=Click%20the%20icon%20for%20selections.&AreaText2=Select%20one%20Region%20before%20selecting%20Zones.&Area_Fill_In=&Area_Fill_In_5=&Area_Fill_In_6=&Area_Fill_In_7=&Area_Fill_In_8=&Area_Fill_In_9=&Areas_PB=Click%20the%20icon%20for%20selections.&Bathrooms_From=%20&Bathrooms_From_F=%20&Bathrooms_From_H=%20&Bathrooms_Thru=%20&Bathrooms_Thru_F=%20&Bathrooms_Thru_H=%20&Bedrooms_From=%20&Bedrooms_Thru=%20&CP_Encrypted_String=&CP_KeyRid=1&CP_SID=&CP_Search_Name=&CP_hidEntryPoint=&CP_hidMLS=LUBB&Cities_PB=Lubbock%2CShallowater%2CWolfforth&City=&CityText=Click%20the%20icon%20for%20selections.&City_Fill_In=Lubbock%2CShallowater%2CWolfforth&DOTNET_SessionNumber=000000000&DotNet_CP_Search=&Enforce_Area_To_City=N&Include_0_SqFt=on&IsClientPortal=N&IsFranchise=N&IsPublic=Y&IsRegion=N&Latitude=33.578015&Longitude=-101.859741&Lot_Measurement=S&Lot_Size_From=&Lot_Size_Thru=&MLS_Origin=LUBB&PRGNAME=MLSSearchSaveCriteria&PT_Measurement_Default_String=S%2CA%2CS%2CA%2CA%2CA&Post_Direction=&Post_Direction_1=&Post_Direction_10=&Post_Direction_2=&Post_Direction_3=&Post_Direction_4=&Post_Direction_5=&Post_Direction_6=&Post_Direction_7=&Post_Direction_8=&Post_Direction_9=&Price_From_M1=100&Price_From_M2=000&Price_Thru_M1=200&Price_Thru_M2=000&Prop_Count=6&Prop_Subtype_COMM_0001_X=INDU&Prop_Subtype_COMM_0002_X=OFFC&Prop_Subtype_COMM_0003_X=BUSN&Prop_Subtype_COMM_0004_X=RETA&Prop_Subtype_COMM_0005_X=SHOP&Prop_Subtype_COMM_0006_X=SPEC&Prop_Subtype_COMM_0007_X=VACN&Prop_Subtype_COMM_0008_X=PACK&Prop_Subtype_COMM_0009_X=REST&Prop_Subtype_COMM_0010_X=HOSP&Prop_Subtype_Count_COMM=10&Prop_Subtype_Count_FARM=9&Prop_Subtype_Count_LAND=10&Prop_Subtype_Count_MULT=9&Prop_Subtype_Count_RENT=9&Prop_Subtype_Count_RESI=7&Prop_Subtype_FARM_0001_X=FARM&Prop_Subtype_FARM_0002_X=FARA&Prop_Subtype_FARM_0003_X=FARB&Prop_Subtype_FARM_0004_X=FARC&Prop_Subtype_FARM_0005_X=FARD&Prop_Subtype_FARM_0006_X=FARE&Prop_Subtype_FARM_0007_X=FARF&Prop_Subtype_FARM_0008_X=FARG&Prop_Subtype_FARM_0009_X=FARH&Prop_Subtype_LAND_0001_X=INDU&Prop_Subtype_LAND_0002_X=OFFC&Prop_Subtype_LAND_0003_X=RETA&Prop_Subtype_LAND_0004_X=RETP&Prop_Subtype_LAND_0005_X=COMO&Prop_Subtype_LAND_0006_X=LSLD&Prop_Subtype_LAND_0007_X=MULT&Prop_Subtype_LAND_0008_X=RESL&Prop_Subtype_LAND_0009_X=RESA&Prop_Subtype_LAND_0010_X=VACL&Prop_Subtype_MULT_0001_X=DUPL&Prop_Subtype_MULT_0002_X=TRIP&Prop_Subtype_MULT_0003_X=FOUR&Prop_Subtype_MULT_0004_X=GARD&Prop_Subtype_MULT_0005_X=GOVE&Prop_Subtype_MULT_0006_X=MIDH&Prop_Subtype_MULT_0007_X=MHRV&Prop_Subtype_MULT_0008_X=SENR&Prop_Subtype_MULT_0009_X=STUD&Prop_Subtype_RENT_0001_X=SNGL&Prop_Subtype_RENT_0002_X=CNDO&Prop_Subtype_RENT_0003_X=TWNH&Prop_Subtype_RENT_0004_X=GRPT&Prop_Subtype_RENT_0005_X=MFMD&Prop_Subtype_RENT_0006_X=APAR&Prop_Subtype_RENT_0007_X=EFFI&Prop_Subtype_RENT_0008_X=LOFT&Prop_Subtype_RENT_0009_X=DUPL&Prop_Subtype_RESI_0001_X=ACRG&Prop_Subtype_RESI_0002=on&Prop_Subtype_RESI_0002_X=SNGL&Prop_Subtype_RESI_0003_X=SNFR&Prop_Subtype_RESI_0004_X=CNDO&Prop_Subtype_RESI_0005_X=TWNH&Prop_Subtype_RESI_0006_X=GRPT&Prop_Subtype_RESI_0007_X=MFMD&Prop_Type_RESI=on&Prop_Types_Amenity_String=Y%2CY%2CY%2CY%2CY%2CY&Prop_Types_Auction_String=&Prop_Types_Measurement_String=E%2CE%2CS%2CE%2CE%2CE&Prop_Types_String=RESI%2CRENT%2CMULT%2CCOMM%2CFARM%2CLAND&RegionLabel=Region&RegionText=Click%20the%20icon%20for%20selections.&Region_Fill_In_5=&Region_Fill_In_6=&Region_Fill_In_7=&Region_Fill_In_8=&Region_Fill_In_9=&Regions_PB=&SB_Use_Exact=exact&Search_Type=PB&Single_PT_Selected=&State=&Street_Address=&Street_Address_1=&Street_Address_10=&Street_Address_2=&Street_Address_3=&Street_Address_4=&Street_Address_5=&Street_Address_6=&Street_Address_7=&Street_Address_8=&Street_Address_9=&Street_Direction=&Street_Direction_1=&Street_Direction_10=&Street_Direction_2=&Street_Direction_3=&Street_Direction_4=&Street_Direction_5=&Street_Direction_6=&Street_Direction_7=&Street_Direction_8=&Street_Direction_9=&Street_Number=&Street_Number_From_1=&Street_Number_From_10=&Street_Number_From_2=&Street_Number_From_3=&Street_Number_From_4=&Street_Number_From_5=&Street_Number_From_6=&Street_Number_From_7=&Street_Number_From_8=&Street_Number_From_9=&Street_Number_Thru_1=&Street_Number_Thru_10=&Street_Number_Thru_2=&Street_Number_Thru_3=&Street_Number_Thru_4=&Street_Number_Thru_5=&Street_Number_Thru_6=&Street_Number_Thru_7=&Street_Number_Thru_8=&Street_Number_Thru_9=&Street_Suffix=&Street_Suffix_1=&Street_Suffix_10=&Street_Suffix_2=&Street_Suffix_3=&Street_Suffix_4=&Street_Suffix_5=&Street_Suffix_6=&Street_Suffix_7=&Street_Suffix_8=&Street_Suffix_9=&Structure_Square_Feet_From=&Structure_Square_Feet_Thru=&SubdivisionText=Click%20the%20icon%20for%20selections.&SubdivisionType=N&Subdivision_Fill_In=&SubdivisionsLabel=Sub%20Zone&Subdivisions_PB=Click%20the%20icon%20for%20selections.&SubmitInProcess=Yes&Submit_Value=&Unit_Number_1=&Unit_Number_10=&Unit_Number_2=&Unit_Number_3=&Unit_Number_4=&Unit_Number_5=&Unit_Number_6=&Unit_Number_7=&Unit_Number_8=&Unit_Number_9=&Use_Exact_1=begins&Use_Exact_10=begins&Use_Exact_2=begins&Use_Exact_3=begins&Use_Exact_4=begins&Use_Exact_5=begins&Use_Exact_6=begins&Use_Exact_7=begins&Use_Exact_8=begins&Use_Exact_9=begins&Year_Built_Exception=0&Year_Built_From=&Year_Built_Thru=&Zip_Code=&Zip_Fill_In=&geo_Street_Address=&rad_Center_Lat=33.578015&rad_Center_Lng=-101.859741&rad_End_Lat=&rad_End_Lng=&rad_Start_Lat=&rad_Start_Lng=&rad_Zoom_Level=180524&submit=Submit';
    request.post(url0, function(error, response, html){
    //request(url1, function(error, response, html){
        //res.send(html);
        //return;
        var records = [];
        if (!error) {
            //Remove comments and additional <text> fields in the XML
            var packed = minHtml(html);
            getSessionNumber(html);
            //Filter down to records table
            var rows = getTableRows(packed);
            console.log('scrapped %d listings',((rows.length-1)/4));
            //Skip first row, and then read every 3 of 4 TRs until the end.
            for (var i = 1; i < rows.length - 3; i += 4) {
                var rcd = {};
                //Third TR with MLS number
                parseRow3(rows[i + 2], rcd);
                //First TR wil price, house details
                parseRow1(rows[i], rcd);
                //Second TR with address, agent info, remarks
                parseRow2(rows[i + 1], rcd);
                records.push(rcd);
            }
        } else {
            console.log('error occurred, ' + error);
        }
        processScrape(records);
        scrapeReturn(res);
    });
}
function getSessionNumber(html){
    var match = /mgSessionNumber\s=\s([\d]{8,10};)/.exec(html);
    if(match && match.length > 1){
        sessionId = match[1];
    }
}
function processScrape(results) {
    //Remove stale listings, mark watched as removed if needed.
    listingModel.find().exec(function(err,MasterList){
        MasterList.map(function(listing) {
            //Check each listing to see if it is removed
            var found = results.some(function(el){
                return (el.mls===listing.mls);
            });

            if (!found) { //Removed
                if(listing.userStatus==='Watched')
                {
                    listing.userStatus = 'Removed';
                    listing.save();
                } else{
                    listing.remove();
                }
            }
        });
    });

    results.map(function(listing) {
        listingModel.findOneAndUpdate(
            {mls:listing.mls},
            {
                $setOnInsert:{
                    'userStatus':'New'
                },
                $set:listing
            },
            {upsert:true},
            function(err, doc){
                if (err){
                    console.log('error inserting/updating ',doc);
                }
            });
    });
}
function minHtml(html) {
    return minify(html,
        {
            removeScriptTypeAttributes:true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true,
            removeIgnored: true,
            removeComments: true,
            collapseWhitespace: true,
            removeEmptyElements: true,
            removeAttributeQuotes: true
        });
}
function getTableRows(html) {
    var inXpath = 'table[1]/tr/td/table[2]';
    var xpath = inXpath.split('/');
    var bodyText = cheerio.load(html);
    var sss = bodyText('#WorkspaceBGSH');
    for (var i = 0; i < xpath.length; i++) {
        if (xpath[i].indexOf('[') === -1) {
            sss = sss.children(xpath[i]);
        } else {
            var selector = xpath[i].split('[')[0];
            var matches = xpath[i].match(/\[(.*?)\]/);
            var index = matches[1] - 1;
            sss = sss.children(selector).eq(index);
        }
    }
    return sss['0'].children;
}
function parseRow1(row, record) {
    try{
        record.price = row.children[0].children[0].data;
    }catch(e){
        record.price = "Unknown";
    }
    try{
        record.beds = row.children[1].children[0].data;
    }catch(e){
        record.beds = "Unknown";
    }
    try{
        record.baths = row.children[2].children[0].data;
    }catch(e){
        record.baths = "Unknown";
    }
    try{
        record.sqft = row.children[3].children[0].data;
    }catch(e){
        record.sqft = "Unknown";
    }
    try{
        record.lot = row.children[4].children[0].data;
    }catch(e){
        record.lot = "Unknown";
    }
    try{
        record.year = row.children[5].children[0].data;
    }catch(e){
        record.year = "Unknown";
    }
}
function parseRow2(row, record) {
    try {
        //                tr /    td  /   table
        var row2Table = row.children[0].children[0];
        //                        table   /   tr[0]     /   td[0]   /  font    /   a       /    text
        record.listingStatus = row2Table.children[0].children[0].children[0].children[0].children[0].data;
        try {
            //                    table  /   tr[0]  /   td[1]    /   table
            var row2InfoTable = row2Table.children[0].children[1].children[0];
            try {
                //                     table        / tr[0]    /  td       / table     / tr[1]
                var addressTableRow = row2InfoTable.children[0].children[0].children[0].children[1];
                record.address = addressTableRow.children[0].children[0].children[0].data + ' ' + //td[0]/font/text
                addressTableRow.children[1].children[0].children[0].data + ' ' + //td[1]/font/text
                addressTableRow.children[2].children[0].data;                    //td[2]/text
            } catch (e) {
                console.log('error getting address for MLS', record.mls, e);
            }
            try {
                var agentRow = row2InfoTable.children[1]; //tr[1]
                //                      tr  /   td       /    a      /  text
                record.agentName =  agentRow.children[0].children[1].children[0].data;
                record.office =     agentRow.children[1].children[1].children[0].data;
                var phonesRow = row2InfoTable.children[2]; //tr[2]
                //                         tr  /  td       /  text
                record.agentNumber =  phonesRow.children[0].children[1].data;
                record.officeNumber = phonesRow.children[1].children[1].data;
            } catch (e) {
                console.log('error getting agent info for MLS', record.mls, e);
            }
            try {
                record.remarks = row2InfoTable.children[3].children[0].children[1].data;
            } catch (e) {
                console.log('error getting remarks info for MLS', record.mls, e);
                record.remarks = 'ERROR';
            }
        } catch (e) {
            console.log('no info table for MLS', record.mls, e);
        }
    } catch (e) {
        console.log('parseRow2, no row2Table, MLS ', record.mls, e);
    }
    try {
        //         tr /  td      /   table    /  tr[1]    /  td       /  a
        var pics = row.children[0].children[0].children[1].children[0].children[0];
        record.imageUrl = pics.children[0].attribs.src;
    } catch (e) {
        console.log('parseRow2, no image url. MLS ', record.mls, e);
    }
}
function parseRow3(row, record) {
    //                  td      /   table   /   tr      /   td      /   text
    record.mls = row.children[0].children[0].children[0].children[0].children[3].data;
    try{
        var latLonString = row.children[0].children[0].children[0].children[4].children[0].attribs.onclick;
        //ShowListingMap('201501391', ' 33.531013', '-101.716209');return false
        var matches = latLonString.match(/[-]?\d{1,3}\.\d{0,6}/g);
        record.lat = matches[0].trim();
        record.lon = matches[1].trim();
    } catch(e){
        record.lat = 0;

        record.lon = 0;
    }
    var RID;
    try{
        RID = row.children[0].children[0].children[0].children[2].children[0].attribs.href;
        //javascript:OpenListingDetail('201500649', 89579, openDetailInNewWindow);
        RID = /,\s?([\d]{4,6}),/.exec(RID);
        record.RID = RID[1];
    }catch(e){
        record.RID = '0';
    }

}

app.listen(port);
console.log('Server running on port %s', port);
scrape({json:function(){
    console.log('Initial data loaded');
}});
exports = module.exports = app;