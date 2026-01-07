(async () => {
    // const audio_url = "https://v3-dy-o.zjcdn.com/b30a749b0035acb441badbf3547230b6/69592720/video/tos/cn/tos-cn-vd-0026/3c2b23c66e654991879cd094406a7954/media-audio-und-mp4a/?a=6383&ch=0&cr=8&dr=0&er=1&lr=default&cd=0%7C0%7C0%7C3&cv=1&br=50&bt=50&cs=4&mime_type=video_mp4&qs=15&rc=OzNmaTs8NDY8PGgzOzUzaUBpandvbXA5cjo8ODMzNGkzM0AwLi9eLzQyYDEtMDJeYTBiYSNgYGNkMmQ0ZV9hLS1kLTBzcw%3D%3D&btag=c0000e00028000&cc=1f&cquery=100w_100o&dy_q=1767363790&l=20260102222310A2DFB384278080E38B04&req_cdn_type="
    const video_url = "https://v3-dy-o.zjcdn.com/750942c71beca2a9e3789c44b35721ff/695ab405/video/tos/cn/tos-cn-ve-15/ok6vZAOqmGQ2fIEShqLeBCA1fcpgFkIE7DGjBh/?a=6383&ch=26&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=619&bt=619&cs=0&ds=4&ft=kFJEkD5A724kjHe9wUx4ByzlHC~KHriWuIniXwG&mime_type=video_mp4&qs=0&rc=OmhmNWdpZWQ1ZzU3NTNmNEBpM3l4bXI5cmZtODMzNGkzM0BfYDE0NTVhNmAxMy0vMjFjYSNmYmlsMmQ0Ll5hLS1kLTBzcw%3D%3D&btag=80000e00020000&cc=1f&cquery=100B_100H_100K_100o_100w&dy_q=1767541159&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20260104233919D227CB4BF09B5E139109&req_cdn_type=&testst=1767541369595"

    const fetchMedia = (media_url)=>{
        return fetch(media_url).then(async (res)=>{
            const contentLength = res.headers.get("content-length")
            const contentType = res.headers.get("content-type")
            console.log("download",{fetchMedia,contentType,contentLength})
            const buffer = await res.arrayBuffer();
            const blob = new Blob([buffer], { type:contentType}); // or audio/mpeg
            const url = URL.createObjectURL(blob);
            const ext = contentType.replace("video/","").replace("audio/","")
            const a = document.createElement('a');
            a.href = url;
            a.download = Date.now()+"."+ext;
            document.body.appendChild(a);
            a.click();
            a.remove();

            URL.revokeObjectURL(url);
        })
    }
    await fetchMedia(video_url)
    return "download ok"
})();
