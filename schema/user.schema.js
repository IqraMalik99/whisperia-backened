import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { request } from "express";
const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            // validate:{
            //     validator:(v)=>{
            //     return v[9]==="@"
            //     },
            //      message: props => `The email '${props.value}' must have an '@' symbol at the 10th position.`
            // }
        },
        password: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        request: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
        ,
        refreshToken: {
            type: String
        },
        avatar: {
            type: String,
            default: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMcAAACUCAMAAAAQwc2tAAAAMFBMVEXMzMz////Pz8/8+/zJycnX19f09PT4+PjT09Po6Ojk5OTs7Ozf39/a2trx8fHGxsY4AFzyAAAE1klEQVR4nO2dSZbjIAxAMcgGM5j737YgTipJxTPCkuvlL/r1ohf8gCwxthBfvnyhAYSQdwQAdWsOAdG0vndDd2dwXlzOBaLwndaqSdz+uP1Fa23lhUxiDE6rTPOBduYyJkbnX3/aIzFY6gZuAfxk419QavCGupnLALRO3+NiSUS7lrqpS4Dw+jaiVnokmXaWb5eAcePvvTaybv/CGUnd4GlAdqsCLyp6CMDRBILeoXFTsQxFQO7VSHGSol2myoW67S+A2TOofkXCWHvxoV372M6IeF4eZtjwlZrtEerW/yKHQxKZjlGHxP6wRtN4NoEOoUCjaYzg4rH/i/vKwEQjuiKNVKFQG9wAU9YdKa+3HKZWRUE+0nPw2FUdTtNxiBB7LAG+ohjMdM3xFPhkoJ9U+fLuaHIypKY8yjM9tYYsTR4jjjjSoUUZVimFEHuUlVZPAnEKsUgexAFSMPF4R9N+eQ8sLsx40AbIf/FokTSahtZjdXH9Gh7wX/rj6/H1+Hqc4RFoPXDKXfI8WLzm84B4Zos0jaKfSGF5UK+YYBUm1AsNWB8s6nMBaOsM1EuK/8UjYGSQvN1J7IEysAYGe1IYC6OWwR7hoQMA73SGwZ4tIOzjCAYeoi2tsfI2DgOP4jVFG4GFhyyL9J7Nqd6iWYgWXDQElOwR2kjd/CcFm4Qs9mrvSNkOq4dEZzSoC903pAzDsXNktMsLf5FZ5IgG9fTpL0mk3V+fKM8oOEayyO5zr9x6437rxuxL7AwOMXww3h0Ctz3YVW8E/aTjk1EkbA2SwQNHiwcgc5es9kq+lcOmGplGhn71SLINDEPjD+l3bhfDRPWBT2W4CMjWTmbFpKetv9KVtVQ6+s+Q16GNDK9KLAMQwVvX6czgnI0xcg/ueWJ83Eq9rILIeQ5AMDqIX8TjovDV+Xrw4uvBi+t7QEZc2uIm0IYQfJ+x3vvbzbQLZcNUkAgTbO/+lL3KpeIkVexXyewyhFRVzRTtuuuvUPFCrnNX79F3tmUdMJAmg8Om1R/dG66dAiDtale8dIqywHDBBKLp9ZanAN46hd/wSn0x/sp7RJrOGk73z0GmSaw64KHUEAwXj/SNcgd3P25PgDBZBAKRAuOoR34kpHMtg601mFgX2Yu21PVKigyUk5bExxOh+CzDg440SHAuQY6Q3d5O+VsffF1iWoSqUnEbniTaJUKyB926nWXIOnkXWp5bc8GB7dlNIudOgssfM5hGnfu+TNJAjYwXkXDiWSwwDXps/IqcWKSYOgp3Tns9Y/Pm8iHUSWdn8GqRObpTRNCuOM9zxokNwLpxvsQJ5S/ejVpKkYh30W6ZukeaaqXxT+oev4SqX9w3asZ6tLWy+AR9tbwOBne+sYyu9uCw6c70qDayoFe1qtxp6jzvlWZOs08116GrMbIA7PyT05Wo8cgMeHW6R413ytBuNu8BP9TrV+tTVLhd3587pO6gR0i1hYVl0DvEnhziD5BXfXN3kHjgPrg25g4KD9ykLjWZR4M4ESFI5U8sXofEbsslgkp0iAOLyiGj0CxOWeqZB29gUZRWT9C+WGiP8h0D6x3u/f+RBC4K6c1OwNnqP+7hkQYWbXig1VgID2KUgXPWIYUHZfpocvGOMbDyxJzWAydA4MzF0GlQMiH05B4bMuEPZVg866VQypEAAAAASUVORK5CYII="
        }
    }
    ,
    {
        timestamps: true
    }
);
//  middleware
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        try {
            let salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (error) {
            return next(error)
        }

    }
    next()
});
// methods  //     Todo: add secret and expires in .env file
userSchema.methods.genRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
    process.env.TOKEN,
        { expiresIn: '7d' });
}
userSchema.methods.genAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username
    },
    process.env.TOKEN,
        { expiresIn: '2d' });
}
userSchema.methods.checkPassword = async function (password) {
    console.log(password, this.password,"My password");
    let ans = await bcrypt.compare(password, this.password);
   
    
    
    return ans;
}
const User = mongoose.model('User', userSchema);
export { User }