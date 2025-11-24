import Image from "next/image";

export default function Home() { 
  return ( 
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black"> 
      {/* 修正点: sm:items-start を削除し、justify-center を追加 */}
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black"> 
        <h1 className="text-center">Web Launcher</h1> 
        {/* text-centerは画像の親要素ではなく、画像自体またはそのラッパーに適用されることが多いですが、ここではFlexboxが機能しています */}
        <Image 
          className="dark:invert" // text-centerは削除、Flexboxの親要素で中央寄せを実現
          src="/icon.svg" 
          alt="Web Launcher Logo" 
          width={100} 
          height={100} 
          priority 
        /> 
      </main> 
    </div> 
  ); 
}