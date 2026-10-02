import { ProfileAudioPlayer } from './ProfileAudioPlayer';
/** Shares the approved native player layout; controls stay unavailable until recordings exist. */
export function ReaderListeningPanel(props:{visible:boolean;onClose:()=>void;bookId:string;bookName:string;chapter:number}) {
 return <ProfileAudioPlayer {...props}/>;
}
