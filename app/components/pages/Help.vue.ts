import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import electron from 'electron';

@Component({
})
export default class Help extends Vue {
  videos = [
    {
      readMore: false,
      name: 'Streamlabs OBS Quickstart',
      description: 'How to Download, Install, and Go Live with Streamlabs OBS.',
      link: 'https://www.youtube.com/watch?v=d--1z_W9IVw&t=1s',
      image: './media/images/yt-thumbnails/slobs-quickstart.png',
      infoOverview: 'If you have made it here, you have already successfully downloaded and installed Streamlabs OBS. Let’s get into a few of the reasons why many streamers have Streamlabs OBS as their go-to choice for streaming software.',
      infoDirections: 'Streamlabs OBS takes 4 windows that are essential for every streamer (chat, live stream preview, recent events, and OBS Scene Switcher) and condenses them into 1 tab in Streamlabs OBS. This preserves valuable screen real estate, reduces cpu load, and you can lower cpu load to leverage a higher quality stream. The Streamlabs theme library is the largest library of themes and widgets in the world. The theme library provides $1M worth of content available for free, with one-click installation. With Streamlabs OBS, you can set up to go live in mere minutes with our Optimization feature, quickly import scenes & settings from OBS, and have easy one-click installation of themes and widgets.'
    },
    {
      readMore: false,
      name: 'Merch Store Setup',
      description: 'Build a Streamlabs automated Merch Store in under 60 seconds.',
      link: 'https://www.youtube.com/watch?v=epd8cYG2ArI',
      image: './media/images/yt-thumbnails/merch-setup.png',
      infoOverview: 'Having a merch store is a great way for your viewers to support you and promote your channel by showing off a hoodie, some mugs, or other merch with your brand printed on it. The Streamlabs merch store is conveniently set up in a way that your viewers can browse your store, make their purchase, and have the items produced and shipped with a quick turnaround time and no additional work for you!',
      infoDirections: 'First, navigate to the "Merch Store" page within the Dashboard. Click  “Add a new product” to choose a product. You can see a large selection of merch. Select the colors or styles of them item you have chosen. Then upload your graphic. This will automatically show your media gallery, but you may also upload a new image from your computer. To move or resize the image on the item, click it and use the tools to the right. Next you can name your merch and set a price. You can even create a custom alert for the item to thank your supporters for purchasing. Alerts are a great tool to remind viewers you have merch available every time someone makes a purchase. When you’re all done, click save, wait a couple moments, and the product will be posted to your store which lives on your tip page.'
    },
    {
      readMore: false,
      name: 'Affiliates Guide',
      description: 'Earn revenue and raise money for charity by sharing Streamlabs OBS with your friends.',
      link: 'https://www.youtube.com/watch?v=cHMyxE5NsFQ',
      image: './media/images/yt-thumbnails/affiliates-guide.png',
      infoOverview: 'If you’ve been livestreaming to an audience, chances are at some point one of your viewers has asked what software you use to broadcast. We’ve created the Streamlabs Affiliate program to reward our loyal user base for pointing their friends to our software with a recommendation. Here’s how to set it up.',
      infoDirections: 'The cash you’ll receive for referrals is processed through PayPal, so the first thing you’ll want to do is make sure that is set up and linked to your Streamlabs account. Navigate to “Donation Settings” in the Dashboard located under “My Account”. If it shows you are connected, great, you can skip this step. If not, press the button and fill out the email for your PayPal and press “Connect”. After you’ve connected Paypal, navigate to the “Affiliates” tab under “Streamlabs OBS”. Here you’ll see confirmation that you’ve completed step 1, and here in step 2 you’ll be able to copy a unique URL created just for you. This link will allow your viewers and friends to download SLOBS and let us know how successful you were in referring us. You can share this link anywhere you think would be easy for viewers to find, whether it’s a channel info panel, in a Youtube video description, or DM to a friend. Once someone has installed SLOBS using your link, you will get an email from Streamlabs. Just click the link and you’ll be prompted to update your password for your newly created Everflow.io login. After this step, you’ll be directed to your Affiliate Dashboard, which can also be accessed from your Streamlabs Dashboard in the Affiliates section.'
    },
    {
      readMore: false,
      name: 'Frame Management Help',
      description: 'Spot issues with CPU and GPU usage while streaming.',
      link: 'https://www.youtube.com/watch?v=WnRhaZaQ2ns',
      image: './media/images/yt-thumbnails/frame-management.png',
      infoOverview: 'It’s important to understand that frame issues are often caused by CPU and GPU overload, and you can identify when there’s a problem by keeping an eye on them in your Windows task manager. Also note that certain games and applications can be more taxing on the CPU or GPU, and this will vary from different programs. There are three main types of lost frames: Lagged frames, which are caused by a compositor overload, and common with high GPU usage; Skipped frames, which occur when the encoder is overloaded, often with high CPU usage; and dropped frames, which happen when network issues exist and could be caused by servers or equipment.',
      infoDirections: 'For issues with lagged frames, we recommend to try lowering the quality of the game so Streamlabs OBS has some breathing room to compose the frames of the encoder. You can also limit the FPS or use V-sync. We recommend you consider locking your settings in your game to 120FPS and 120Hz, as this nicely divides for 60FPS and 30FPS streaming. When experiencing skipped frames, check for high CPU usage. If you’re using software x264 encoding, consider using a faster preset or start using hardware encoding (NVENC/AMD) and this will be less taxing on your CPU to encode the stream. Poor network or internet connections are often the cause of dropped frames. Try manually connecting to the closest server on the streaming platform you’re using. You can also try to restart your networking gear, like your modem, router, or switches, and see if that helps. Lastly, you’ll want to also check that the video and audio bitrate is not exceeding your internet upload speed, so be sure to check both of these. There are many internet speed tests websites you can use to check your speed for free.'
    },
    {
      readMore: false,
      name: 'Troubleshooting Alerts',
      description: 'Identify and correct issues with your alerts.',
      link: 'https://www.youtube.com/watch?v=GfVQ9KhBlDU',
      image: './media/images/yt-thumbnails/troubleshooting-alerts.png',
      infoOverview: 'Sometimes alert issues come up. We have some tips on how to effectively identify and correct issues you may have with your alerts using Streamlabs OBS.',
      infoDirections: 'First we recommend trying the basics: making sure your software is up to date. Check your version of Streamlabs OBS to make sure it’s the current version. You can see what version your software is in the upper left side of the application. If you’re not sure, you can always get a fresh download to install from streamlabs.com, where we always have the latest version to download. Most Streamlabs tools use Twitch, YouTube, Mixer or other APIs to pull info. Logging out of Streamlabs and then logging back in, with the streaming service account that was causing issues, will attempt to recreate the connection. In Streamlabs OBS, make sure you fully log out of the application by clicking the logout button on the upper-right. Restart the application and log back in to reactivate your widgets. Sometimes an Alert issue may originate from the connection between your Streamlabs OBS and the website, or the cache within the source. If you are using Streamlabs OBS, try to clear the cache by removing your Widget Sources and re-adding them back in. Please watch our YouTube video for more suggestions.'
    },
    {
      readMore: false,
      name: 'How To Stream On Twitch',
      description: 'Make sure your account is linked, check your donation settings and import a free overlay.',
      link: 'https://www.youtube.com/watch?v=aplbiAgZjtY&t',
      image: './media/images/yt-thumbnails/stream-to-twitch.png',
      infoOverview: 'The first thing you’re going to want to do is get over to Twitch.tv and create your account if you haven’t already. This can be done quickly by clicking sign up and filling out your basic information. You may need to check your email for a verification email to fully complete this process.',
      infoDirections: 'In the top left of the navigation bar, make sure you are signed into your Twitch account and have authorized streaming from the Streamlabs software. Next, we’ll connect payment options so your viewers can tip you! Navigate to Donation Settings in the Dashboard and click “Paypal” and fill out your credentials so donations can go to your account. You can also enable other payment options like credit cards, cryptocurrencies through Coinbase, and more. Make sure to grab the URL for your donations and place it somewhere your viewers can see it on your channel. There’s a lot of things you can do with Streamlabs OBS to improve the quality of your stream. With our library of free themes, you can have a fully designed and professional theme in seconds. Go to the Themes tab and  check out ‘Scene themes’. Pick a favorite, click install, and you will be directed back to the Editor page. Once you gather the courage to hit that big green Go Live button there’s no turning back. Best of luck and happy streaming!'
    }
  ]

  openDiscord() {
    electron.remote.shell.openExternal('https://discordapp.com/invite/stream');
  }

  openYoutube() {
    electron.remote.shell.openExternal('https://www.youtube.com/user/TwitchAlerts');
  }

  openVideo(link: string) {
    electron.remote.shell.openExternal(link);
  }

  showMoreInfo(idx: number) {
    this.videos[idx].readMore = true;
  }

  hideMoreInfo(idx: number) {
    this.videos[idx].readMore = false;
  }
}
