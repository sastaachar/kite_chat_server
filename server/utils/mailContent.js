const getMailContent = (username, url) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KiteChat Mail</title>
      <style>
        .btn:hover{transform:translateY(-2px)}
      </style>
      <style type="text/css">
        @import url("https://fonts.googleapis.com/css2?family=Scope+One");
              @media screen and (max-width: 600px) {
              }
              @media screen and (max-width: 400px) {
              }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f6f9fc;">
      <center class="wrapper" style="width:100%;table-layout:fixed;background-color:#f6f9fc;padding-bottom:40px;">
        <div class="webkit" style='position:relative;width:360px;height:586px;background-image:url("https://i.ibb.co/FHCS0pZ/background.png");background-size:cover;background-repeat:no-repeat;'>
          <tabel class="outer" align="center" style="width:100%;max-width:400px;border-spacing:0px;">
            <tr>
              <td style="padding:0;">
                <a href="#"><img src="https://i.ibb.co/9HC5zZw/kite-Chat-Logo.png" alt="kite-Chat-Logo" class="logo" style="border:0;width:250px;position:absolute;left:0px;top:0px;"></a>
              </td>
            </tr>
            <tr>
              <td class="content-outer" style="padding:0;position:relative;margin-top:170px;">
                <table class="content" style="border-spacing:0;position:relative;color:whitesmoke;text-align:center;font-family:Scope One, serif;max-width:70%;text-align:left;padding-left:10%;line-height:20px;letter-spacing:1.4px;position: relative; top: 200px; border-spacing: 0px;">
                  <tr>
                    <td class="username-wrapper" style="padding:0;">
                      <span>Hello, &nbsp;</span><span class="highlight" style="color:#faff0a;">@</span><span class="username">${username}</span>
                    </td>
                  </tr>
                  <tr>
                    <td class="main-message" style="padding:0;padding-top:15px;">
                      You are one click away, Hit the verify button and start
                      chatting.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;">
                      <div class="btn" style="margin-top:15px;background-color:#19183f;padding:7px 5px;color:#00e0b9;width:fit-content;border-radius:4px;cursor:pointer;margin-bottom:10px;">
                        <a href=${url} style="color:#00e0b9;">verify email</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;">
                      <p class="note" style="margin:0;letter-spacing:1px;color:whitesmoke;font-size:9px;">
                        NOTE : This link is only valid for 3 hours.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                <p class="footer note" style="margin:0;letter-spacing:1px;color:whitesmoke;font-size:9px;margin-top:170px;position:absolute;bottom:0px;padding-bottom:10px;text-align:left;padding-left:31px;">
                  This is a service notification mailing. For support please mail
                  us at
                  <a href="mailto:help.kitechat@gmail.com" style="color: whitesmoke;">support</a>
                  .
                </p>
              </td>
            </tr>
          </tabel>
        </div>
      </center>
    </body>
  </html>
  `;
};

module.exports = {
  getMailContent,
};
