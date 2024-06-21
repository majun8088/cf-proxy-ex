addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  thisProxyServerUrlHttps = `${url.protocol}//${url.hostname}/`;
  thisProxyServerUrl_hostOnly = url.host;
  //console.log(thisProxyServerUrlHttps);
  //console.log(thisProxyServerUrl_hostOnly);

  event.respondWith(handleRequest(event.request))
})

const str = "/";
const proxyCookie = "__PROXY_VISITEDSITE__";
var thisProxyServerUrlHttps;
var thisProxyServerUrl_hostOnly;
// const CSSReplace = ["https://", "http://"];
const httpRequestInjection = `

//information
var now = new URL(window.location.href);
var path = now.pathname.substring(1);
if(!path.startsWith("http")) path = "https://" + path;
var base = now.host;
var protocol = now.protocol;
var nowlink = protocol + "//" + base + "/";




inject();





//add change listener - new link
window.addEventListener('load', () => {
  loopAndConvertToAbs();
  obsPage();
});
console.log("WINDOW ONLOAD EVENT ADDED");



function loopAndConvertToAbs(){
  for(var ele of document.querySelectorAll('*')){
    covToAbs(ele);
  }
  console.log("LOOPED EVERY ELEMENT");
}
function inject(){
  //inject network request
  var originalOpen = XMLHttpRequest.prototype.open;
  var originalFetch = window.fetch;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if(url.indexOf(base) == -1) url = nowlink + new URL(url, path).href;
    console.log("R:" + url);
    return originalOpen.apply(this, arguments);
  };

  window.fetch = function(input, init) {
    var url;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
    } else {
      url = input;
    }
  
    if (url.indexOf(base) == -1) {
      url = nowlink + new URL(url, path).href;
    }
    
    console.log("R:" + url);
    if (typeof input === 'string') {
      return originalFetch(url, init);
    } else {
      const newRequest = new Request(url, input);
      return originalFetch(newRequest, init);
    }
  };
  
  console.log("NETWORK REQUEST METHOD INJECTED");

}


function obsPage(){
  var yProxyObserverTimeoutId;
  var yProxyObserverEles = []; // 初始化 yProxyObserverEles 数组
  var yProxyObserver = new MutationObserver(elements => {
    yProxyObserverEles = yProxyObserverEles.concat(elements);
    clearTimeout(yProxyObserverTimeoutId);
    yProxyObserverTimeoutId = setTimeout(() => {
      for(var ele of yProxyObserverEles){
          covToAbs(ele);
      }
      yProxyObserverEles = [];
    }, 500);
  });
  var config = { attributes: true, childList: true, subtree: true };
  yProxyObserver.observe(document.body, config);

  console.log("OBSERVING THE WEBPAGE...");
}
function covToAbs(element){
  var relativePath = "";
  var setAttr = "";
  if (element instanceof HTMLElement && element.hasAttribute("href")) {
    relativePath = element.getAttribute("href");
    setAttr = "href";
  }
  if (element instanceof HTMLElement && element.hasAttribute("src")) {
    relativePath = element.getAttribute("src");
    setAttr = "src";
  }
  
    //new URL("a", "htpps://www.google.com/b").href;
  if(setAttr != "" && !relativePath.includes(base)){ //!relativePath.includes(nowlink)防止已经改变，因为有observer
    if(!relativePath.includes("*")){
      if(!relativePath.startsWith("data:") && !relativePath.startsWith("javascript:")){
        try{
          // console.log(relativePath);
          var absolutePath = nowlink + new URL(relativePath, path).href;
          element.setAttribute(setAttr, absolutePath);
        }catch{
          console.log(path + "   " + relativePath);
        }
      }
    }
  }
}

`;
const mainPage = `
<html>
<head>
    <style>
    body {
      background-color: #fbfbfb;
      font-family: Arial, sans-serif;
    }
  
    h1 {
      text-align: center;
      color: #444;
    }
  
    .container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  
    form {
      background-color: white;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
      padding: 2rem;
      border-radius: 8px;
    }
  
    input {
      display: block;
      width: 100%;
      font-size: 18px;
      padding: 15px;
      border: solid 1px #ccc;
      border-radius: 4px;
      margin: 1rem 0;
    }
  
    button {
      padding: 15px;
      background-color: #0288d1;
      color: white;
      font-size: 18px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
    }
  
    button:hover {
      background-color: #039BE5;
    }
  </style>
      <meta charset="UTF-8">
      <title>代理服务器</title>
    </head>
    <body>
      <h1>输入您想访问的网址</h1>
      <form id="proxy-form">
        <input type="text" id="url" name="url" placeholder="https://example.com" required />
        <button type="submit">访问</button>
      </form>
      <script>
        const form = document.getElementById('proxy-form');
        form.addEventListener('submit', event => {
          event.preventDefault();
          const input = document.getElementById('url');
          const actualUrl = input.value;
          const proxyUrl = '/pro/' + actualUrl;
          location.href = proxyUrl;
        });
      </script>
    </body>
</html>
`;
const redirectError = `
<html><head></head><body><h2>Error while redirecting: the website you want to access to may contain wrong redirect information, and we can not parse the info</h2></body></html>
`;

//new URL(请求路径, base路径).href;

async function handleRequest(request) {
  const url = new URL(request.url);
  //var siteOnly = url.pathname.substring(url.pathname.indexOf(str) + str.length);

  var actualUrlStr = url.pathname.substring(url.pathname.indexOf(str) + str.length) + url.search + url.hash;
  if (actualUrlStr == "") { //先返回引导界面
    return getHTMLResponse(mainPage);
  }


  try {
    var test = actualUrlStr;
    if (!test.startsWith("http")) {
      test = "https://" + test;
    }
    var u = new URL(test);
    if (!u.host.includes(".")) {
      throw new Error();
    }
  }
  catch { //可能是搜素引擎，比如proxy.com/https://www.duckduckgo.com/ 转到 proxy.com/?q=key
    var siteCookie = request.headers.get('Cookie');
    var lastVisit;
    if (siteCookie != null && siteCookie != "") {
      lastVisit = getCook(proxyCookie, siteCookie);
      console.log(lastVisit);
      if (lastVisit != null && lastVisit != "") {
        //(!lastVisit.startsWith("http"))?"https://":"" + 
        //现在的actualUrlStr如果本来不带https:// 的话那么现在也不带，因为判断是否带protocol在后面
        return Response.redirect(thisProxyServerUrlHttps + lastVisit + "/" + actualUrlStr, 301);
      }
    }
    return getHTMLResponse("Something is wrong while trying to get your cookie: <br> siteCookie: " + siteCookie + "<br>" + "lastSite: " + lastVisit);
  }



  if (!actualUrlStr.startsWith("http") && !actualUrlStr.includes("://")) { //从www.xxx.com转到https://www.xxx.com
    //actualUrlStr = "https://" + actualUrlStr;
    return Response.redirect(thisProxyServerUrlHttps + "https://" + actualUrlStr, 301);
  }
  //if(!actualUrlStr.endsWith("/")) actualUrlStr += "/";
  const actualUrl = new URL(actualUrlStr);

  let clientHeaderWithChange = new Headers();
  //***代理发送数据的Header：修改部分header防止403 forbidden，要先修改，   因为添加Request之后header是只读的（***ChatGPT，未测试）
  for (var pair of request.headers.entries()) {
    //console.log(pair[0]+ ': '+ pair[1]);
    clientHeaderWithChange.set(pair[0], pair[1].replaceAll(thisProxyServerUrlHttps, actualUrlStr).replaceAll(thisProxyServerUrl_hostOnly, actualUrl.host));
  }

  let clientRequestBodyWithChange
  if (request.body) {
    clientRequestBodyWithChange = await request.text();
    clientRequestBodyWithChange = clientRequestBodyWithChange
      .replaceAll(thisProxyServerUrlHttps, actualUrlStr)
      .replaceAll(thisProxyServerUrl_hostOnly, actualUrl.host);
  }

  const modifiedRequest = new Request(actualUrl, {
    headers: clientHeaderWithChange,
    method: request.method,
    body: (request.body) ? clientRequestBodyWithChange : request.body,
    //redirect: 'follow'
    redirect: "manual"
    //因为有时候会
    //https://www.jyshare.com/front-end/61   重定向到
    //https://www.jyshare.com/front-end/61/
    //但是相对目录就变了
  });

  //console.log(actualUrl);

  const response = await fetch(modifiedRequest);
  if (response.status.toString().startsWith("3") && response.headers.get("Location") != null) {
    //console.log(base_url + response.headers.get("Location"))
    try {
      return Response.redirect(thisProxyServerUrlHttps + new URL(response.headers.get("Location"), actualUrlStr).href, 301);
    } catch {
      getHTMLResponse(redirectError + "<br>the redirect url:" + response.headers.get("Location") + ";the url you are now at:" + actualUrlStr);
    }
  }

  var modifiedResponse;
  var bd;

  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.startsWith("text/")) {
    bd = await response.text();

    //ChatGPT
    let regex = new RegExp(`(?<!src="|href=")(https?:\\/\\/[^\s'"]+)`, 'g');
    bd = bd.replace(regex, (match) => {
      if (match.includes("http")) {
        return thisProxyServerUrlHttps + match;
      } else {
        return thisProxyServerUrl_hostOnly + "/" + match;
      }
    });

    console.log(bd); // 输出替换后的文本

    //bd.includes("<html")  //不加>因为html标签上可能加属性         这个方法不好用因为一些JS中竟然也会出现这个字符串
    if (contentType && contentType.includes("text/html")) {
      //console.log("STR" + actualUrlStr)
      bd = covToAbs(bd, actualUrlStr);
      bd = "<script>" + httpRequestInjection + "</script>" + bd;
    }
    //else{
    //   //const type = response.headers.get('Content-Type');type == null || (type.indexOf("image/") == -1 && type.indexOf("application/") == -1)
    //   if(actualUrlStr.includes(".css")){ //js不用，因为我已经把网络消息给注入了
    //     for(var r of CSSReplace){
    //       bd = bd.replace(r, thisProxyServerUrlHttps + r);
    //     }
    //   }
    //   //问题:在设置css background image 的时候可以使用相对目录  
    // }
    //console.log(bd);

    modifiedResponse = new Response(bd, response);
  } else {
    var blob = await response.blob();
    modifiedResponse = new Response(blob, response);
  }




  let headers = modifiedResponse.headers;
  let cookieHeaders = [];

  // Collect all 'Set-Cookie' headers regardless of case
  for (let [key, value] of headers.entries()) {
    if (key.toLowerCase() == 'set-cookie') {
      cookieHeaders.push({ headerName: key, headerValue: value });
    }
  }


  if (cookieHeaders.length > 0) {
    cookieHeaders.forEach(cookieHeader => {
      let cookies = cookieHeader.headerValue.split(',').map(cookie => cookie.trim());

      for (let i = 0; i < cookies.length; i++) {
        let parts = cookies[i].split(';').map(part => part.trim());
        //console.log(parts);

        // Modify Path
        let pathIndex = parts.findIndex(part => part.toLowerCase().startsWith('path='));
        let originalPath;
        if (pathIndex !== -1) {
          originalPath = parts[pathIndex].substring("path=".length);
        }
        let absolutePath = "/" + new URL(originalPath, actualUrlStr).href;;

        if (pathIndex !== -1) {
          parts[pathIndex] = `Path=${absolutePath}`;
        } else {
          parts.push(`Path=${absolutePath}`);
        }

        // Modify Domain
        let domainIndex = parts.findIndex(part => part.toLowerCase().startsWith('domain='));

        if (domainIndex !== -1) {
          parts[domainIndex] = `domain=${thisProxyServerUrl_hostOnly}`;
        } else {
          parts.push(`domain=${thisProxyServerUrl_hostOnly}`);
        }

        cookies[i] = parts.join('; ');
      }

      // Re-join cookies and set the header
      headers.set(cookieHeader.headerName, cookies.join(', '));
    });
  }
  //bd != null && bd.includes("<html")
  if (contentType && contentType.includes("text/html") && response.status == 200) { //如果是HTML再加cookie，因为有些网址会通过不同的链接添加CSS等文件
    let cookieValue = proxyCookie + "=" + actualUrl.origin + "; Path=/; Domain=" + thisProxyServerUrl_hostOnly;
    //origin末尾不带/
    //例如：console.log(new URL("https://www.baidu.com/w/s?q=2#e"));
    //origin: "https://www.baidu.com"
    headers.append("Set-Cookie", cookieValue);
  }

  // 添加允许跨域访问的响应头
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
  modifiedResponse.headers.set("Content-Security-Policy", "");
  modifiedResponse.headers.set("X-Frame-Options", "");

  return modifiedResponse;
}
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& 表示匹配的字符
}

//https://stackoverflow.com/questions/5142337/read-a-javascript-cookie-by-name
function getCook(cookiename, cookies) {
  // Get name followed by anything except a semicolon
  var cookiestring = RegExp(cookiename + "=[^;]+").exec(cookies);
  // Return everything after the equal sign, or an empty string if the cookie name not found
  return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./, "") : "");
}

const matchList = [[/href=("|')([^"']*)("|')/g, `href="`], [/src=("|')([^"']*)("|')/g, `src="`]];
function covToAbs(body, requestPathNow) {
  var original = [];
  var target = [];

  for (var match of matchList) {
    var setAttr = body.matchAll(match[0]);
    if (setAttr != null) {
      for (var replace of setAttr) {
        if (replace.length == 0) continue;
        var strReplace = replace[0];
        if (!strReplace.includes(thisProxyServerUrl_hostOnly)) {
          if (!isPosEmbed(body, replace.index)) {
            var relativePath = strReplace.substring(match[1].toString().length, strReplace.length - 1);
            if (!relativePath.startsWith("data:") && !relativePath.startsWith("javascript:")) {
              try {
                var absolutePath = thisProxyServerUrlHttps + new URL(relativePath, requestPathNow).href;
                //body = body.replace(strReplace, match[1].toString() + absolutePath + `"`);
                original.push(strReplace);
                target.push(match[1].toString() + absolutePath + `"`);
              } catch {
                // 无视
              }
            }
          }
        }
      }
    }
  }
  for (var i = 0; i < original.length; i++) {
    body = body.replace(original[i], target[i]);
  }
  return body;
}

// console.log(isPosEmbed("<script src='https://www.google.com/'>uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu</script>",2));
// VM195:1 false
// console.log(isPosEmbed("<script src='https://www.google.com/'>uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu</script>",10));
// VM207:1 false
// console.log(isPosEmbed("<script src='https://www.google.com/'>uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu</script>",50));
// VM222:1 true
function isPosEmbed(html, pos) {
  if (pos > html.length || pos < 0) return false;
  //取从前面`<`开始后面`>`结束，如果中间有任何`<`或者`>`的话，就是content
  //<xx></xx><script>XXXXX[T]XXXXXXX</script><tt>XXXXX</tt>
  //         |-------------X--------------|
  //                !               !
  //         conclusion: in content

  // Find the position of the previous '<'
  let start = html.lastIndexOf('<', pos);
  if (start === -1) start = 0;

  // Find the position of the next '>'
  let end = html.indexOf('>', pos);
  if (end === -1) end = html.length;

  // Extract the substring between start and end
  let content = html.slice(start + 1, end);
  // Check if there are any '<' or '>' within the substring (excluding the outer ones)
  if (content.includes(">") || content.includes("<")) {
    return true; // in content
  }
  return false;

}
function getHTMLResponse(html) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
