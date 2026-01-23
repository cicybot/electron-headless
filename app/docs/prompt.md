https://v3-dy-o.zjcdn.com/43d0ba71d684114ba92d60e15a2e1961/695d3174/video/tos/cn/tos-cn-ve-15/ocag5pCbiudeAikASADIAgACOJAHB1B2Agzf9r/media-audio-und-mp4a/?a=6383&ch=0&cr=8&dr=0&er=1&lr=default&cd=0%7C0%7C0%7C3&cv=1&br=189&bt=189&cs=4&mime_type=video_mp4&qs=0&rc=NTY6aDxkZjk7MzZkNjU4ZkBpamU8anA5cjd3NzMzNGkzM0BiNi82NmBiM2FgMWMtX2AuYSNuMmdhMmRzbWNhLS1kLTBzcw%3D%3D&btag=c0000e00030000&cc=1f&cquery=100o_100w&dy_q=1767628468&l=202601052354279F83C6A7659E037B956E&req_cdn_type=

https://v5-dy-o-abtest.zjcdn.com/5f15201372a4ee9e559fc60b5187ee55/695d3174/video/tos/cn/tos-cn-ve-15/ocag5pCbiudeAikASADIAgACOJAHB1B2Agzf9r/media-video-hvc1/?a=6383&ch=0&cr=8&dr=0&er=1&lr=default&cd=0%7C0%7C0%7C3&cv=1&br=1006&bt=1006&cs=4&ds=4&mime_type=video_mp4&qs=0&rc=NjNlZTs3Njc1NjY2NDQzZkBpamU8anA5cjd3NzMzNGkzM0AuYDY1Y2AwNi8xLjVjYS9iYSNuMmdhMmRzbWNhLS1kLTBzcw%3D%3D&btag=c0000e00030000&cquery=100o_100w&dy_q=1767628468&l=202601052354279F83C6A7659E037B956E




    if (typeof url === "string" && (url.includes("media-audio") || url.includes("media-video"))) {
      console.log("[XHR MEDIA]", method, url);
    }


(function() {
  const originalOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._requestUrl = url;
    console.log(url)
    return originalOpen.apply(this, arguments);
  };
})();


使用上面代码过滤包含media-audio或者media-video的url